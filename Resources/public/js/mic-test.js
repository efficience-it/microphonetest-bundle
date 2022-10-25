"use strict";


(async (w) => {
    const { main: main_json } = await import('./config.js');

    const textHelp = document.getElementById('text-help');

    const o = {
        started: false,
        interrupted: false,
        audio_stats: {
            timers: {
                canvas: null,
                test_start: null,
                test_length: 5000
            },
            data: {}
        }
    };

    // Forcing a constant framerate regardless of monitor used
    const rate = 30;
    const fps = {
        interval: 1000/rate,
        timing: {
            now: null,
            then: null,
            elapsed: null
        }
    };
    

    try {
        const peripherals = {
            stream : await navigator.mediaDevices.getUserMedia({ audio: true, video: false }),
            devices: await navigator.mediaDevices.enumerateDevices(),
            audioinput: [],
            audiooutput: []
        };

        for (const kind of ['audioinput','audiooutput']) {
            peripherals[kind] = peripherals.devices.filter((device) => device.kind === kind);
        }

        if (peripherals.audioinput.length > 0) {
            for (const track of peripherals.stream.getAudioTracks()) {
                track.stop();
            }

            const playButton = document.querySelector('button#play');

            let worker = null;
            
            if (playButton !== null) {
                playButton.style.display = 'inline-block';
                textHelp.textContent = main_json.speak;
                playButton.addEventListener('click', async (e) => {

                    const canvas = document.querySelector('canvas#audio-visual');

                    if (o.started === false) {
                        o.started = true;
                        o.interrupted = false;
                        // playButton.textContent = 'Stop';
                        playButton.style.backgroundColor = 'red';
                        playButton.style.display = 'none';
                        textHelp.textContent = null;
                        fps.timing = {
                            now: null,
                            then: null,
                            elapsed: null
                        };
                    }
                    else {
                        o.started = false;
                        playButton.style.backgroundColor = 'green';
                        playButton.style.display = 'inline-block';
                    }


                    if (o.started === true) {

                        if (o.audio_stats.timers.test_start === null) {

                            o.audio_stats.timers.test_start = performance.now();
                            o.audio_stats.data = [];

                            textHelp.textContent = `Recording stops in ${Math.ceil(o.audio_stats.timers.test_length / 1000)} second(s)…`;

                        }

                        worker = new Worker('./bundles/microphonetest/js/stats-worker.js');

                        const audioContext = new AudioContext();
                        const micStream    = await navigator.mediaDevices.getUserMedia({
                            audio: {
                                deviceId: {
                                    exact: peripherals.audioinput[0].deviceId
                                },
                                echoCancellation: false,
                                noiseSuppression: false,
                                autoGainControl: false
                            }
                        });

                        const audioSource = audioContext.createMediaStreamSource(micStream);
                        const analyser    = audioContext.createAnalyser();
                        const audioOutput = audioContext.createMediaStreamDestination();

                        analyser.fftSize = 2048;

                        const bufferLength = analyser.frequencyBinCount;
                        const dataArray    = new Uint8Array(bufferLength);

                        o.dataArray = dataArray;
                        o.track     = audioSource.mediaStream.getAudioTracks().shift();

                        audioSource.connect(analyser);
                        analyser.connect(audioOutput);

                        // Playback
                        o.audioElement     = new Audio();
                        o.audioElement.srcObject = audioOutput.stream;
                        o.audioElement.play();


                        if (o.track.muted === false) {
                            const context = canvas.getContext('2d');

                            function draw() {

                                o.audio_stats.timers.canvas = requestAnimationFrame(draw);

                                fps.now = performance.now();
                                fps.elapsed = fps.now - fps.then;

                                if (fps.elapsed > fps.interval) {

                                    textHelp.textContent = `Recording stops in ${Math.ceil((o.audio_stats.timers.test_length - (performance.now() - o.audio_stats.timers.test_start)) / 1000)} second(s)…`;

                                    fps.then = fps.now - (fps.elapsed % fps.interval);

                                    if (o.track.muted) {

                                        worker.terminate();
                                        cancelAnimationFrame(o.audio_stats.timers.canvas);

                                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

                                        o.track.stop();
                                        o.track = null;
                                        o.audioElement.pause();
                                        o.audioElement = null;

                                        o.started = false;
                                        playButton.style.backgroundColor = 'green';
                                        playButton.style.display = 'inline-block';

                                        o.audio_stats.timers.test_start = null;

                                        o.interrupted = true;

                                        textHelp.textContent = main_json.no_muting;

                                    }
                                    else {

                                        analyser.getByteFrequencyData(dataArray);

                                        worker.postMessage(dataArray);
                                        worker.onmessage = (e) => {

                                            if ((performance.now() - o.audio_stats.timers.test_start) <= o.audio_stats.timers.test_length) {

                                                for (let k of Object.keys(e.data)) {

                                                    if(o.audio_stats.data.hasOwnProperty(k) === false) {
                                                        o.audio_stats.data[k] = [];
                                                    }

                                                    o.audio_stats.data[k].push(e.data[k]);

                                                }

                                            }
                                            else {

                                                worker.terminate();
                                                textHelp.textContent = null;
                                                cancelAnimationFrame(o.audio_stats.timers.canvas);

                                                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

                                                o.track.stop();
                                                o.track = null;
                                                o.audioElement.pause();
                                                o.audioElement = null;

                                                o.audio_stats.timers.test_start = null;

                                                o.started = false;
                                                playButton.style.backgroundColor = 'green';
                                                playButton.style.display = 'inline-block';


                                                // Interpret results to validate levels
                                                const data_to_validate = {
                                                    sub: Math.max(...o.audio_stats.data.sub_min),
                                                    bass: Math.max(...o.audio_stats.data.bass_min),
                                                    low: Math.max(...o.audio_stats.data.low_min),
                                                    mid: Math.max(...o.audio_stats.data.mid_min),
                                                    high: Math.max(...o.audio_stats.data.high_min),
                                                    max: Math.max(...o.audio_stats.data.max)
                                                };

                                                worker = new Worker('./bundles/microphonetest/js/validation-worker.js');

                                                worker.postMessage(data_to_validate);
                                                worker.onmessage = async (response) => {

                                                    worker.terminate();
                                                    const errors_found = (response.data.errors.length === 0) ? false : true;

                                                    if (errors_found) {
                                                        let error_line = null;
                                                        let ulElement = document.createElement('ul');
                                                        ulElement.style.listStyleType = 'none';
                                                        ulElement.style.alignContent = 'center';
                                                        ulElement.style.padding = '0';


                                                        let error_messages = response.data.errors.map((element) => element.message).filter((v, i, self) => self.indexOf(v) === i);

                                                        while (error_line = error_messages.shift()) {
                                                            let li = document.createElement('li');
                                                            li.textContent = error_line;
                                                            ulElement.appendChild(li);
                                                        }

                                                        textHelp.appendChild(ulElement);
                                                    }
                                                    else {
                                                        let p = document.createElement('p');
                                                        p.textContent = "Nothing to report, your microphone is functional."
                                                        textHelp.appendChild(p);
                                                    }

                                                    let xhr = new XMLHttpRequest();
                                                    xhr.open('POST', location.origin + "/microphone-results", true);
                                                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                                                    xhr.send(JSON.stringify(response.data));
                                                };

                                            }

                                        };


                                        context.clearRect(0, 0, canvas.width, canvas.height);


                                        const barWidth = (canvas.width / bufferLength) * 2;
                                        let barHeight;
                                        let x = 0;

                                        for (let i = 0; i < bufferLength; i++) {
                                            barHeight = dataArray[i];
                                            let percentage = barHeight/255*100;

                                            switch (true) {
                                                case percentage>=85:
                                                    context.fillStyle = `rgb(255, 0, 0)`;
                                                    break;
                                                case percentage>=70:
                                                    context.fillStyle = `rgb(255, 255, 0)`;
                                                    break;
                                                default:
                                                    context.fillStyle = `rgb(50, 205, 50)`;
                                                    break;
                                            }
                                            context.fillRect(x,canvas.height-barHeight/2,barWidth,barHeight/2);

                                            x += barWidth + 1;
                                        }


                                    }
                                }

                            }

                            fps.then = performance.now();

                            draw();
                        }
                        else {
                            o.started = false;
                            playButton.style.backgroundColor = 'green';
                            playButton.style.display = 'inline-block';
                            textHelp.textContent = main_json.unmute;
                            o.audio_stats.timers.test_start = null;
                        }

                    }
                    else {

                        worker.terminate();
                        cancelAnimationFrame(o.audio_stats.timers.canvas);

                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

                        o.track.stop();
                        o.track = null;
                        o.audioElement.pause();
                        o.audioElement = null;

                        o.started = false;
                        playButton.style.backgroundColor = 'green';
                        playButton.style.display = 'inline-block';
                    }

                });
            }

        }
    }
    catch (e) {

        // User needs to allow microphone access
        if (e instanceof DOMException && e.name === 'NotAllowedError') {
            // console.error(e.name, e.message);
            textHelp.style.opacity = 1;
            textHelp.textContent = main_json.allow_mic;
            // setTimeout(() => {
                document.getElementById('play').style.display = 'none';
            // }, 100);
        }
    }


})(window);
