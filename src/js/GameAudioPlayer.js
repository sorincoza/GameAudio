

const AUDIO_EXTENSION_DEFAULT = 'mp3';
const AUDIO_DIR_NAME_DEFAULT = 'assets/sounds';


function getAppBasePath(){
    var SEPARATOR = '/',
        path_pieces = window.location.href.split( SEPARATOR ),
        last_path_piece = path_pieces[ path_pieces.length-1 ];

    // if it ends in ".html", then we are in PhoneGap / Cordova environment (probably)
    if( last_path_piece.indexOf( '.html' ) ) {
        path_pieces[ path_pieces.length-1 ] = '';
    }else{
        path_pieces[ path_pieces.length   ] = '';
    }

    return  path_pieces.join( SEPARATOR );
}


function getAudioFullPath( file ){
    var appBasePath = getAppBasePath();
    appBasePath = trimChar( appBasePath, '/' )+'/';
    file = file ? trimChar( file, '/' ) : '';

    return appBasePath+file;  // has slash at end

}


function getAudioFile( file ){
    // if it's not an absolute path, make it!
    if( file.indexOf('//') < 0 ){
        file = getAudioFullPath( file );
    }

    return file;
}



// HELPERS:
function escapeRegExp(strToEscape) {
    // Escape special characters for use in a regular expression
    return strToEscape.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function trimChar(origString, charToTrim) {
    charToTrim = escapeRegExp(charToTrim);
    var regEx = new RegExp("^[" + charToTrim + "]+|[" + charToTrim + "]+$", "g");
    return origString.replace(regEx, "");
}




class GameAudioPlayer{

    // TODO: this constructor looks too long
    constructor( sound_file, options ){

        if( ! options  ||  typeof options !== 'object') options = {};

        this.SOUND = sound_file;

        this.loop = false;
        this._isPlaying = false;
        this.loopListenerIsSetUp = false;

        this.CACHE = {
             player: {}, // this will be an Audio object
             src: '' // this will be a blob source for our audio
        };

        this.load();


        this._onReadyCb = options.onLoad ? options.onLoad : false; // stores the callback for onReady


        this._spriteInterval = null;

        this._wasPrePlayed = false;
        this._isPreplaying = false;
        if( options.preload ){
            this.setUpEarliestPrePlay();
        }


        this._haveCreateJS = this.haveCreateJS;

    }


    get AUDIO_PLATFORM(){
        //return ( window.Media ? 'Media' : 'Audio' );
        return 'Audio';
    }

    get haveCreateJS(){
        if( !this._haveCreateJS ){
            this._haveCreateJS = !! window.createjs;
        }

        return this._haveCreateJS;
    }



    reset(){
        // reset to Media if we are in Phonegap (not working at the moment due to Cordova bug - https://forum.ionicframework.com/t/ios-9-2-cordova-plugin-media-no-sound-fix-on-the-way/45100/15 )
        this.CACHE.player = this.getNewAudio();
    }



    /**
     * Fetches the audio file via AJAX, and caches the results (including a new Audio instance)
     */
    load(){

        let src = getAudioFile(this.SOUND);


        // if CreateJS library is loaded we are using it!
        if( this.haveCreateJS ){
            createjs.Sound.registerSound( src, this.SOUND );
            createjs.Sound.on("fileload", ()=>{
                this.CACHE.player = this.getNewAudio();
                this._executeOnLoad();
            });
            return;
        }


        // else go with our own simple implementation:
        let xhr = (typeof XMLHttpRequest !== 'undefined') ? ( new XMLHttpRequest() ) : false,
            canLoadFromAjax = xhr  &&  ( typeof xhr.responseType !== 'undefined' );

        if (canLoadFromAjax) {

            xhr.onreadystatechange = ()=>{
                if (xhr.readyState === 4 && xhr.status === 200) {
                    this.CACHE.src = window.URL.createObjectURL(xhr.response);
                    this.CACHE.player = this.getNewAudio();
                    this._playbackEnd_Watchers();
                    this._executeOnLoad();
                }
            };
            xhr.open('GET', src);
            xhr.responseType = 'blob';
            xhr.send();

        }else{
            // set it up in the classic way:
            this.CACHE.src = src;
            this.CACHE.player = this.getNewAudio();
            this._playbackEnd_Watchers();
            this._executeOnLoad();
        }

    }




    /**
     * Emulate the usual Audio.play() function in JS
     */
    play(){
        let player = this.CACHE.player;
        if( player ) {
            if( this._isPreplaying ){
                // force preplay stop
                player.pause();
                this._isPreplaying = false;
            }
            if(this._wasPrePlayed ){
                player.muted = false; // reset volume if this was preplayed
            }
            player.play();
            this._isPlaying = true;

        }
    }

    playSprite( timeStart, timeEnd ){
        let player = this.CACHE.player;
        if( player ) {
            if (timeStart !== null && timeEnd) {
                this._clearSpriteInterval();
                this.setUpSpritePlay(timeStart, timeEnd);
            }
            this.play();
        }
    }

    playLoop(){
        this.loop = true;

        // try for CreateJS:
        if( this.haveCreateJS ){
            this.CACHE.player.play( { loop: -1 } );
            return;
        }

        if( typeof this.CACHE.player.loop !== 'undefined')
            this.CACHE.player.loop = true;
        else
            this.setupLoop();

        this.play();
    }

    /**
     * Emulate the usual Audio.pause() function in JS
     */
    pause(){
        let player = this.CACHE.player;

        if( player ) {

            if( this.haveCreateJS ) player.paused = true;
            else player.pause();

            this._clearSpriteInterval();
            this._destroyLoop();
        }
        this._isPlaying = false;
    }



    /**
     * Plays a sound even if it didn't finish playing.
     * Therefore you can hear the same sound playing at the same time multiple times.
     */
    playAsync(){
        if( this.isPlaying() ) this.playNewAudio(); // duplicate and play that
        else this.play();
    }



    /**
     * When sound is loaded and ready to play, we call this callback passing this
     */
    _executeOnLoad(){
        if( this._onReadyCb ){
            this._onReadyCb( this );
            this._onReadyCb = false; // remove Cb, since this is executed only once
        }
    }



    set volume( volume ){
        this.CACHE.player.volume = volume;
    }
    set autoplay( val ){
        this.CACHE.player.volume = val;
    }


    /**
     * Determines if the current sound is playing
     * @returns boolean
     */
    isPlaying(){
        return this._isPlaying;
    }


    /**
     * Creates a new Audio object for us to use
     * @returns {Audio}
     */
    getNewAudio(){

        if( this.haveCreateJS ){

            return createjs.Sound.createInstance( this.SOUND );

        }else {

            var player = new window[this.AUDIO_PLATFORM]();
            if (this.CACHE.src) player.src = this.CACHE.src;
            if (this.loop) {
                player.loop = true;
            }
            return player;
        }
    }


    /**
     * Creates and plays a new (duplicate) audio
     */
    playNewAudio(){
        this.getNewAudio().play();
    }

    /**
     * Loop implementation
     */
    setupLoop(){
        if( !this.loopListenerIsSetUp) {
            this.CACHE.player.onended = function () {
                this.currentTime = 0;
                this.play();
            };

            this.loopListenerIsSetUp = true;

        }
    }

    _destroyLoop(){
        this.CACHE.player.onended = null;
        this.loopListenerIsSetUp = false;
        this.loop = false;
    }


    /**
     * This will play silently the audio in the background, the idea being to make sure the audio is loaded and ready for play
     * In practice, I don't think this is needed, because we are already preloading the sounds.
     */
    setUpEarliestPrePlay(){

        let _preplay = ()=>{
            if( ! this._wasPrePlayed  &&  !this._isPreplaying  &&  this.CACHE.player.play ){
                this.CACHE.player.muted = true;
                this.play();
                this._isPreplaying = true;
                this._wasPrePlayed = true;
                window.removeEventListener( 'click', _preplay );
            }
        };

        window.addEventListener( 'click', _preplay );

    }




    /**
     * This plays the sprite between the designated time intervals.
     * If the loop is active, then it loops it until a pause() is called, which clears the interval
     *
     * @param timeStart
     * @param timeEnd
     */
    setUpSpritePlay( timeStart, timeEnd ){
        var player = this.CACHE.player,

            start = timeStart ? timeStart : 0,
            end = timeEnd ? timeEnd : 1000,

            INTERVAL_DURATION = 25, // ms
            MAX_INTERVAL_CYCLES = Math.ceil( (end-start)*1000/INTERVAL_DURATION ),
            currentIntervalCycle = 0;

        if( ! player.play ) return;

        player.currentTime = start; // make sure we are at the right starting position


        var _intervalFn = ()=>{
            currentIntervalCycle++;
            if( currentIntervalCycle >= MAX_INTERVAL_CYCLES ){
                this.pause(); // this also clears the current interval
            }

            if (player.currentTime >= end) {
                if( !this.loop ) {
                    this.pause();
                }
                else{
                    // loop it!
                    this.playSprite( start, end ); // careful, since this is recursive
                }
            }
        };

        this._spriteInterval = setInterval( _intervalFn , INTERVAL_DURATION );
    }

    _clearSpriteInterval(){
        if( this._spriteInterval ) clearInterval( this._spriteInterval );
    }

    _playbackEnd_Watchers(){
        var onEndPlayback = ()=>{
            if( !this.loop )
                this.pause(); // call this to unset any interval left, and to signal that it is paused
        };
        this.CACHE.player.addEventListener( 'ended', onEndPlayback );
        //this.CACHE.player.addEventListener( 'pause', onEndPlayback );
    }


}


export default GameAudioPlayer;