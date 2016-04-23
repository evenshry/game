var musicBg, musicGmf, musicCrash, isPlayMusic = true;
var initAudio = function() {
    musicBg = document.createElement("audio");
    musicBg.loop = 'loop';
    musicBg.preload = 'auto';
    // musicBg.controls = 'controls';
    // musicBg.autoplay = 'autoplay';
    musicBg.src = 'mp3/bg.mp3';
    document.body.appendChild(musicBg);
    musicGmf = document.createElement("audio");
    musicGmf.src = 'mp3/gmf0.mp3';
    musicGmf.preload = 'auto';
    document.body.appendChild(musicGmf);
    musicCrash = document.createElement("audio");
    musicCrash.src = 'mp3/crash.mp3';
    musicCrash.preload = 'auto';
    document.body.appendChild(musicCrash);
    $('.musicOn').on('touchstart', playOrPauseMusic);
};
var playOrPauseMusic = function(event) {
    if (isPlayMusic) {
        isPlayMusic = false;
        musicBg.pause();
        $(event.target).addClass('musicOff');
    } else {
        isPlayMusic = true;
        musicBg.play();
        $(event.target).removeClass('musicOff');
    }
};
var muted = function() {
    if (musicBg.muted) {
        musicBg.muted = false;
        musicGmf.muted = false;
    } else {
        musicBg.muted = true;
        musicGmf.muted = true;
    }
};