# Microphone-test bundle

This microphone-test is a Symfony-based bundle.

It was created by Efficience IT, a French company located in Lille.

## Installation

### Step 1: Install the bundle with Composer

Require the `efficience-it/microphonetest-bundle` with [Composer](https://getcomposer.org/).

```bash
$ composer require efficience-it/microphonetest-bundle
``` 

### Step 2: Configure the microphone-test in your project

Verify if the line below is in the `bundles.php` file. If not, copy and paste it.

```php
EfficienceIt\MicrophoneTestBundle\MicrophoneTestBundle::class => ['all' => true]
```

### Step 3: Add the microphone-test on your website

On any controller, you can call the MicrophoneTestService and its `displayMicrophoneTest` function.

Here is an example of a controller, with a route tht includes the bundle:

```php
class HomeController extends AbstractController
{    
    /**
     * @Route("/home", name="app_home")
     */
    public function index(MicrophoneTestService $microphoneTestService): Response
    {
        // Replace 'home/index.html.twig' with the name of your template
        return $this->render('home/index.html.twig', [
            'microphone' => $microphoneTestService->displayMicrophoneTest()
        ]);
    }
}
}
```

To display the microphone-test on your page, just include it in your template file as below:

```php
{% extends 'base.html.twig' %}

{% block title %}Hello HomeController!{% endblock %}

{% block body %}
    {% include microphone %}
{% endblock %}
```

You can access to your route (in this example `localhost/home`), and the microphone-test should appear !

## How to retrieve the results ?

Create a new Controller (for example `ResultsController`), and copy/paste this code:

```php
/* DON'T ADD A @Route ANNOTATION */
class ResultsController extends AbstractController
{    
    /* DON'T CHANGE THIS ROUTE ! */
    /**
     * @Route("/microphone-results", name="microphone_results", methods={"POST"})
     */
    public function microphoneResults(Request $request): Response
    {
        if (!$request->isXmlHttpRequest()) {
            throw new AccessDeniedException();
        }

        $requestContent = json_decode($request->getContent(), true);
        dump($requestContent);

        return new JsonResponse($requestContent);
    }
}
```

With this route (called in AJAX), you can retrieve your microphone test results and do whatever you want with it !
