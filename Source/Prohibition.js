/*
---
description: "Secret Knock" authentication

license: MIT-style

authors:
- Justin Donato

requires:
- core/1.2.4: [Class, Class.Extras, Element, Element.Event, Element.Style, Selectors]

provides: [Prohibition]

...
*/

/*
    Copyright (c) 2010 Justin Donato

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
*/

var Prohibition = new Class({
    
    Implements: [Options, Events],
    options: {
        'delay': 2000,
        'evaluator': undefined,
        'mousedownClass': 'prohibition-mousedown',
        'record': false,
        'threshold': .04,
        'allowedErrors': 0
    },
    
    initialize: function(elem, options){
        this.sequence = [];
        this.setOptions(options);
        this.record = this.options.record;
        this.elem = document.id(elem) || new Element('div');
        this.setup(this.elem);
    },
    
    setup: function(elem){
        elem.addEvent('click', function(evt){
            this.manageTimer();
            this.handleKnock(evt);
        }.bind(this)) 

        elem.addEvent('mousedown', function(evt){
            this.elem.toggleClass(this.options.mousedownClass);
        }.bind(this));

        elem.addEvent('mouseup', function(evt){
            this.elem.toggleClass(this.options.mousedownClass);
        }.bind(this));
    },

    toggleRecordMode: function(){
        this.record = !this.record; 
    },

    manageTimer: function(){
        // reset the current timer
        if(this.timer){
           if(window.hasOwnProperty('$clear')){
               $clear(this.timer);
           }
           else{
                this.timer.clear();
           }
        }
        // Create a new timer
        this.timer = this.handleDoneKnocking.delay(this.options.delay, this);
    },
    
    handleKnock: function(evt){
        var time = new Date(evt.event.timeStamp).getTime();
        this.sequence.push(time);
        this.fireEvent('knock');
    },

    handleDoneKnocking: function(evt){
        // Normalize the knock sequence and clear out the global
        var normalized = this.normsequence(this.sequence);
        this.sequence.empty();
        
        // If you're in recording mode, fire off the
        // done recording event, otherwise get an evaluator
        // and pass the sequence to it.

        if(this.recording){
            this.fireEvent('doneRecording', [normalized]);
        }
        else{
            this.fireEvent('doneKnocking', [normalized]);
        }
    },

    normsequence: function(sequence){
        // Map values of sequence to the range of 0 -> 1

        var normalized = [];
        var min = sequence[0];
        var max = sequence[sequence.length -1];
        for(var i=0; i < sequence.length; i++){
            var val = sequence[i];
            normalized.push(this.normalize(val, min, max));
        }
        return normalized;
    },

    normalize: function(n, min, max){
        // Map n with limits min and max between 0 -> 1
        return (n - min) / (max - min);
    },

    compare: function(knockone, knocktwo, threshold, allowedErrors){
        // Compare to knock sequences for similiarity and return
        // true or false.
        // This function can be used to do clientside comparisons,
        // or as a reference for an online comparison function

        // threshold can be any number, but as a rule of thumb it 
        // might be set to .01 for a very rigorous comparison,
        // or .09 for a very lenient comparison. .04 is the default.

        threshold = threshold || this.options.threshold;
        allowedErrors = allowedErrors || this.options.allowedErrors;

        // Sequences must have the same number of beats
        if(knockone.length != knocktwo.length) return false;

        // Go through each knock, make sure its within threshold
        // deviation to the corresponding reference knock 
        // Count errors as you go.

        var errors = 0;
        for(var i = 0; i < knockone.length; i++){
            var diff = Math.abs(knockone[i] - knocktwo[i]);
            if(diff > threshold){
                errors++;
            }
        }

        // Return true or false (if more than allowed errors 
        // have been made)
        return (errors <= allowedErrors);
    },

    threshold: function(){
        // Return the set threshold, converting allowed
        // string values to predetermined Numbers

        var threshold = this.options.threshold;
        if(typeof threshold === 'string'){
            threshold = this.thresholds[this.options.threshold];
        }
        return threshold;
    },

    toElement: function(){
        return this.elem;
    }

});
