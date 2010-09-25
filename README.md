
Prohibition
==========
a unique authentication system for the back alleys of the internet.

OverView
--------

Prohibition is a Mootools class that provides an API for doing 
"Secret Knock" authentication. You can use a backend service to 
handle validation, or (if you really don't care about security)
you can use the built-in validator.

Prohibition objects have an optional record mode that you can use
to generate knock sequences.

A Knock sequence is simply a javascript array with Numbers
between 0 and 1 that correspond to the relative time in 
which the knock occurred. (For this reason, knocks sequences
should be at least 3 knocks long.)

Knock sequences are normalized so the pattern can be sped up 
or slowed down and still be matched.

*Important*: It should go without saying--If security is a scale
from 0 to 10, Prohibition offers about a 1. Don't use this for 
anything you really want protected.

Options
--------

delay: 
Time in milliseconds from last knock until validation
occurs. You want this to be long enough so the user
doesn't get cut off, but short enough so that validation
takes place shortly after the user is done.

mousedownClass:
Class that's applied to your door when the user presses
the mousedown.

record:
Places the object into record mode. In record mode, 
after knocking, the object will fire a 'doneRecording' 
event and pass the knock along. Normally you'd only use 
this to serialize a knock pattern.

Events
------

Prohibition fires several events that your code can listen for. 
Use these to update the UI, provide audible feedback, etc.

knock:
Fired whenever the user clicks on the 'door'. You can use this to 
provie ui feedback, play a sound, etc.

doneKnocking:
Fired when a user has knocked on a door and the delay has passed.

doneRecording:
Fired when Prohibition is in 'record' mode and the user
has finished recording her knock.

Usage
-----

In this example, we've hard-coded a Knock Sequence
and uses Prohibitions built in comparison feature.

        var knock = [0, .1, .2, .3, .4, 1];
        
        var door = new Prohibition('door');

        door.addEvent('doneKnocking', function(seq){
            
            // We use the built in 'compare' method
            // and pass in the two knocks to compare

            var authd = door.compare(knock, seq); 
            if(authd){
               // knock is correct: redirect, update ui, etc 
            }
        });

To create a knock sequence, use Prohibition in recording mode:

        var door = new Prohibition('door', {'record': true});
        door.addEvent('doneRecording', function(seq){
            document.write(seq);        
        });

For an ever so slightly more secure version, you might do 
your authentication on the backend:

        var door = new Prohibition('door', {'record': true});
        door.addEvent('doneRecording', function(seq){
            
            // url goes to some service that knows how to
            // compare knocks.

            var req = new Request.JSON({
                'url': 'http://localhost:8000/',
                'method': 'get',
                'data': {'knock': JSON.encode(seq)},
                'onSuccess': function(respobj){
                    // Redirect, create new UI, change state, etc...
                }
            }); 

            req.send();
        });


Validating Knocks on the Server
-------------------------------

Prohibition's compare method is an example of one way to do
validation. Its simple enough that by using it as a reference
anyone should be able to implement in the language of her choice,
but there are other more clever ways to do knock matching, so feel
free to roll your own.

A Django version of this might be:

        def compare(knockone, knocktwo, threshold=.04, allowed_errors=0):
            if not len(knock) is len(reference_knock): return False

            errors = 0
            knocks = zip(knockone, knocktwo)
            for knock in knocks:
                sub, ref = knock
                diff = abs(sub, ref)
                if(diff > threshold):
                    errors += 1
            return errors < allowed_errors

        def compare(request, threshold=.04, allowed_errors=0):
            # Maybe we pass along a username so we can actually authenticate a user
            username = request.GET.get('username')
            knockstr = request.GET.get('knock')
            knock = json.loads(knockstr)

            # The knock could come from the DB, settings, hard-coded, etc
            # it would just be a list of floats between 0 and 1
            reference_knock = settings.PROHIBITION_KNOCK

            auth = compare(knock, reference_knock)
            if auth: 
                # Here you could get a user by that name and set her
                # to logged in, 
                # return ...
            else:
                # Make up your own little protocol to handle auth/unauth
                # responses
                fail = {'status': 0, 'msg': 'Unauthorized!'}
                return HttpResponse(json.dump(fail))

