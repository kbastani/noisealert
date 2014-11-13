/*
 *  Copyright (c) 2014 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

// Meter class that generates a number correlated to audio volume.
// The meter class itself displays nothing, but it makes the
// instantaneous and time-decaying volumes available for inspection.
// It also reports on the fraction of samples that were at or near
// the top of the measurement range.
function SoundMeter(context) {
  this.context = context;
  this.instant = 0.0;
  this.slow = 0.0;
  this.clip = 0.0;
  this.url = "/sendmessage/{0}/{1}";

  $("#btnStart").click(function() {

    var phone = $("#phoneNumber").val();
    if(phone == "" || !phone.contains("+1")) {
      $("#phoneNumber").parents(".form-group").removeClass("has-error").addClass("has-error");
      alert("Input a valid phone number, with country code +1.");
    } else {
      $("#phoneNumber").parents(".form-group").removeClass("has-error");
      $("#phoneNumber").prop('disabled', true);
      $("#threshold").prop('disabled', true);
      $(this).remove();
      tracking=true;
    }
  });

  // The audio sample session object
  this.session = {
    ticksOverThreshold: 0,
    threshold: false,
    cumulativeVolume: new Array(),
    outputTimePeriods: new Array(),
    messageStatus: false,
    sampledData: new Array(),
    thisOutputTimePeriod: 0.0
  }

  if(!('contains' in String.prototype)) {
       String.prototype.contains = function(str, startIndex) {
                return -1 !== String.prototype.indexOf.call(this, str, startIndex);
       };
   }

  this.script = context.createScriptProcessor(2048, 1, 1);

  // Use the reduce function's method signature to get the sum of an array's values
  this.getSum = function(previousValue, currentValue, index, array) {
    return previousValue + currentValue;
  };

  // This method returns true when the current session's cumulative volume output
  // is one of the top 3 highest outputs since the observation began
  this.getMessageStatus = function(that, save) {
    var sendMessage = false;
    var outputTimePeriod = 0.0;
    // Get cumulative volume
    outputTimePeriod = that.session.cumulativeVolume.reduce(that.getSum);
    // If the output time period is in the top 3
    if(that.session.outputTimePeriods.length < 3) {
      sendMessage = true;
      that.session.thisOutputTimePeriod = outputTimePeriod;
      if(save)
        that.session.outputTimePeriods.push(outputTimePeriod);
    } else {
      // Sort the array ascending
      that.session.outputTimePeriods.sort();
      // Replace the value at index 0 if current outputTimePeriod is a greater value
      if(that.session.outputTimePeriods[0] < outputTimePeriod) {
        sendMessage = true;
        that.session.thisOutputTimePeriod = outputTimePeriod;
        if(save)
          that.session.outputTimePeriods[0] = outputTimePeriod;
      }
    }

    return sendMessage;
  };

  // This method returns true if the output volume has exceeded the
  // threshold for at least 1 second and the session's output is
  // in the top 3 highest outputs since the observation began
  this.updateMessageStatus = function(that) {
    // Send message flag
    var notifyUser = false;

    // Record the last second of the output volume if the state has changed
    if(that.session.threshold == false)
      that.session.cumulativeVolume.push(that.slow);

    // Update the threshold state
    that.session.threshold = true;
    that.session.sampledData.push(that.instant);
    // 20 ticks is about 1 second
    if(that.session.ticksOverThreshold >= 20){
      // Capture the cumulative volume output over the time period
      that.session.cumulativeVolume.push(that.slow);
      // Reset the sample counter
      that.session.ticksOverThreshold = 0;
      // Check notification status
      notifyUser = that.getMessageStatus(that, false);
    } else {
      // Increment the sample counter (~50ms per tick)
      that.session.ticksOverThreshold += 1;
    }

    return notifyUser;
  };

  // Shhhhhhh...
  this.sendMessage = function(that) {
    $("#chart-container").trigger("noiseAlert", [that.session.sampledData, that.session.thisOutputTimePeriod]);

    $.ajax({
      url: that.url.replace("{0}", $("#phoneNumber").val()).replace("{1}", "Noise Alert: " + that.session.thisOutputTimePeriod),
      type: 'get',
      headers: {
          "Content-Type": "application/json; charset=utf-8"
      },
      dataType: 'json',
      success: function (data) {
          console.info(data);
      }
    });
};

  var that = this;

  this.script.onaudioprocess = function(event) {
    if(tracking == true) {
    var input = event.inputBuffer.getChannelData(0);
    var i;
    var sum = 0.0;
    for (i = 0; i < input.length; ++i) {
      sum += input[i] * input[i];
    }

    // The average volume for the last 50ms
    that.instant = Math.sqrt(sum / input.length);

    // The average volume for the last 1s
    that.slow = 0.95 * that.slow + 0.05 * that.instant;

    // The average volume for the last 1s has exceeded the minimum threshold
    if(that.slow > parseFloat($("#threshold").val())) {
      // Update the message status
      var notifyUser = that.updateMessageStatus(that);

      // Only notify the user once per session
      if(!that.session.messageStatus ? notifyUser : false) {
        // Update the session's message status
        that.session.messageStatus = true;
        // Send the message notification
        that.sendMessage(that);
      }
    } else {
      if(that.session.threshold) {
        // Save the session's output
        that.getMessageStatus(that, true);
        // Reset session state
        that.session.threshold = false;
        that.session.cumulativeVolume = new Array();
        that.session.sampledData = new Array();
        that.session.ticksOverThreshold = 0;
        that.session.messageStatus = false;
      }
    }
  }
  };
}

SoundMeter.prototype.connectToSource = function(stream) {
  console.log('SoundMeter connecting');
  this.mic = this.context.createMediaStreamSource(stream);
  this.mic.connect(this.script);
  // necessary to make sample run, but should not be.
  this.script.connect(this.context.destination);
};

SoundMeter.prototype.stop = function() {
  this.mic.disconnect();
  this.script.disconnect();
};
