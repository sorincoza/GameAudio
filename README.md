# GameAudio

`GameAudio` contains 2 classes: `GameAudioPlayer` and `GameAudioSpritePlayer`, both attached to the `window` object after inclusion of the script at `/public/js/game-audio.js`

The main purpose of this library is top provide a common set of methods to play sounds with JavaScript, regardless of environment (I'm specifically thinking about PhoneGap/Cordova here, which might use native plugins, etc.; but in any case, we want a single set of methods to use).

# `GameAudioPlayer`

  - `this.play()` Plays the file once, just like the native JS function;
  - `this.playAsync()` Plays the file even if the current sound has not yet finished playing. Good if you need the same sound to overlap;
  - `this.pause()` Pauses the current sound, like the native JS function. Note that if you have used `playAsync()`, some instances of the current sound might continue playing even after calling this method;
  - `this.playLoop()` Plays the sound in a loop until you `pause()` it.
 
### How to use
```
// instantiate the sound:
var song = new GameAudioPlayer( '/sounds/smooth-criminal.mp3' );

// play it once:
playButton.onclick = function(){
    sound.play();
}

// play it in a loop:
loopButton.onclick = function(){
    sound.playLoop();
}

// pause it
loopButton.onclick = function(){
    sound.pause();
}
```



