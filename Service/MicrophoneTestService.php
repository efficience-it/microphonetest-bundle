<?php

namespace EfficienceIt\MicrophoneTestBundle\Service;

class MicrophoneTestService
{
    public function displayMicrophoneTest(): string
    {
        //@microphone_test allows you to go directly to the views folder
        return '@microphone_test/microphone-test.html.twig';
    }
}