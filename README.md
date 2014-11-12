# Noise Alert

Noise alert let's you know via text when you're being too loud in the library.

  npm install
  node app

Navigate to `http://localhost:5000` and type in your phone number with the country code first, ex. +15555555555.

Enter the noise threshold. The default is `0.025` which is the average volume of your voice when speaking inside a room.

The top 3 noise measurements are recorded and displayed as a time series as you get louder and louder.

![Noise alert](http://i.imgur.com/tXNhloK.png)

Make sure you enable your browser's microphone when you first load the page.
