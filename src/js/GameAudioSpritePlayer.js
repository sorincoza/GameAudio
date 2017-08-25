/**
 * Relies on GameAudioPlayer class
 * This provides a nice interface to play sprites like we would on normal audio  -  for example GameAudioSpritePlayer.play()
 *
 * Some methods need to be revisited probably. - TODO
 *
 *
 *
 *
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * ----- IMPORTANT : can save you hours of life --------
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * Audio files need to be constant bit rate, otherwise you can run into timing issues
 *  - see this answer: https://stackoverflow.com/a/37768679/5162081
 *  - see this article: http://terrillthompson.com/blog/624
 *  - see how to convert: https://sites.google.com/site/listentoourlights//home/how-to/converting-mp3-to-constant-bit-rate
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

class GameAudioSpritePlayer{

    constructor( GameAudioPlayer, timeStart, timeEnd ){

        this.GameAudioPlayer = GameAudioPlayer ? GameAudioPlayer : false;
        this.TIME = {
            start: timeStart ? timeStart : 0,
            end: timeEnd ? timeEnd : 1000
        };
        this._isPlaying = false;
    }

    reset(){
        // do nothing yet
    }

    play(){
        this.GameAudioPlayer.playSprite( this.TIME.start, this.TIME.end );
        this._isPlaying = true;
    }

    playLoop(){
        this.GameAudioPlayer.loop = true;
        this.play();
    }

    pause(){
        this.GameAudioPlayer.pause();
        this._isPlaying = false;
    }

    set loop( isLoop ){
        this.GameAudioPlayer.loop = !!isLoop;
    }

    isPlaying(){
        return ( this._isPlaying && this.GameAudioPlayer.isPlaying() );
    }
}

export default GameAudioSpritePlayer;