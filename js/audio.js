var musicBg, musicGmf, musicCrash, isPlayMusic = true;
var initAudio = function() {
    musicBg = document.createElement("audio");
    musicBg.loop = 'loop';
    // musicBg.controls = 'controls';
    musicBg.autoplay = 'autoplay';
    musicBg.src = 'mp3/bg.mp3';
    document.body.appendChild(musicBg);
    musicGmf = document.createElement("audio");
    musicGmf.src = 'mp3/gmf0.mp3';
    document.body.appendChild(musicGmf);
    musicCrash = document.createElement("audio");
    musicCrash.src = 'mp3/crash.mp3';
    document.body.appendChild(musicCrash);
};
var playMusic = function() {
    isPlayMusic = true;
    musicBg.play();
};
var pauseMusic = function() {
    isPlayMusic = false;
    musicBg.pause();
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