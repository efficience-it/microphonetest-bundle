"use strict";


onmessage = async function (e) {

    const worker = {
        "ambient": "Too much ambient noise",
        "high_volume": "Overall volume too high",
        "low_volume": "Overall volume too low"
    };

    const rules = [
        { component: 'sub', formula: '<= 11', msg: worker.ambient },
        { component: 'bass', formula: '<= 30', msg: worker.ambient },
        { component: 'low', formula: '<= 65', msg: worker.ambient },
        { component: 'mid', formula: '<= 40', msg: worker.ambient },
        { component: 'high', formula: '<= 45', msg: worker.ambient },
        { component: 'max', formula: '< 85', msg: worker.high_volume },
        { component: 'max', formula: '>= 70', msg: worker.low_volume }
    ];

    const result = {
        errors: []
    };

    let rule = null;
    while (rule = rules.shift()) {
        const valid = eval(`${e.data[rule.component]} ${rule.formula}`);
        if (valid === false) {
            result.errors.push({ component: rule.component, message: rule.msg });
        }
    }

    postMessage(result);
};
