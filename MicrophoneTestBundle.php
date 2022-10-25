<?php

namespace EfficienceIt\MicrophoneTestBundle;

use EfficienceIt\MicrophoneTestBundle\DependencyInjection\MicrophoneTestExtension;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

class MicrophoneTestBundle extends Bundle
{
    public function build(ContainerBuilder $container)
    {
        parent::build($container);
        $ext = new MicrophoneTestExtension([], $container);

    }
}