var isWeixinBrowser = function() {
    var ua = navigator.userAgent.toLowerCase();
    return (/micromessenger/.test(ua)) ? true : false;
}
if (!isWeixinBrowser()) {
    // $('body').html('Give Me Five!');
}
//========================================================================//
//============================= :: INIT :: ===============================//
//========================================================================//
var canvasContainer, GameStatus = 0; //游戏状态(-1未开始，0进行中，1暂停，2碰撞，3已结束)
var player, shadow, monsters = [],
    asideMiles = [],
    asideCheers = [],
    asideCheers2 = [];
var winWidth, winHeight, isGuide = false;
var startTouchPoint, touchCacheX = 0.15,
    touchCacheY = 0.2;
var startTime, gmfCounts = 0,
    stepLength = 2000;
// 初始化页面
$(function() {
    loadPlayerCnt();
    initAudio();
    $('#submitPwd').on('touchstart', function() {
        var pwd = $('#password').val();
        if (pwd && pwd.length > 0) {
            checkPassport(pwd);
        }
    });
    $('#gameBefore').on('touchstart', '#btnStart', function(event) {
        $('#gameBefore').hide();
        $('#gameing').show();
        initStage();
        stopPropagation(event);
    });
    $('#gameBefore').on('touchstart', '.present', function(event) {
        $('#activity').show();
        stopPropagation(event);
    });
    $('body').on('touchstart touchmove', function(event) {
        event.preventDefault();
    });
    $('input').on('touchstart', function(event) {
        $(this).focus();
    });
    $('.dialog').on('touchstart', '.close', function(event) {
        $(this).closest('.dialog').hide();
        event.preventDefault();
    });
    $('#gameAfter').on('touchstart', '#btnReStart', function(event) {
        $('#gameAfter').hide();
        resetStage(); //重置舞台
        startGame();
        stopPropagation(event);
    }).on('touchstart', '#submitInfo', function(event) {
        submitInfo();
        event.preventDefault();
    });
});
//引导页
var firstGuide = function() {
    musicBg.play();
    $('#guide').on('touchstart', function() {
        $(this).hide();
        startGame();
    }).show();
};
// 初始化舞台
var initStage = function() {
    canvasContainer = document.getElementById('gameing');
    window.onresize = resizeHandler;
    resetStage(); //重置舞台
    var myTouch = util.toucher(document.getElementById('gameing'));
    var len = winHeight > winWidth ? winWidth : winHeight;
    myTouch.on('swipe', function(e) {
        if (e.moveX >= len * touchCacheX) { //right
            if (!player.moving && !player.jumping) {
                player.moving = true;
                player.moveDirect = 1;
                shadow.moving = true;
                shadow.moveDirect = 1;
            }
        } else if (e.moveX <= -len * touchCacheX) { //left
            if (!player.moving && !player.jumping) {
                player.moving = true;
                player.moveDirect = -1;
                shadow.moving = true;
                shadow.moveDirect = -1;
            }
        }
        if (e.moveY <= -len * touchCacheY) { //up
            if (!player.jumping) {
                player.jumping = true;
                player.jumpDirect = 1;
            }
        }
        stopPropagation(e);
    });
    // if (!isGuide) {
    //     firstGuide();
    //     isGuide = true;
    // } else {
    startGame();
    // }
};
var startGame = function() {
    startTime = new Date().getTime();
    gmfCounts = 0;
    DF.AddTime = 1;
    noMoreMonster = false;
    GameStatus = 0;
    requestAnimationFrame(loop, canvasContainer);
};
//改变窗口尺寸
var resizeHandler = function() {
    resetStage();
};
//重置舞台
var resetStage = function() {
    winWidth = $(canvasContainer).width();
    winHeight = $(canvasContainer).height();
    DF.M.maxPath = getScaleY(HEIGHT - yl - 25);
    DF.M.maxPathMile = getScaleY(HEIGHT - yl - 25);
    DF.M.moveSpeed = winHeight * 0.009;
    DF.P.moveSpeed = winHeight * 0.006;
    var k = Math.abs((getScaleX(xl) - getScaleX(xd1)) / (winHeight - getScaleY(yl)));
    DF.P.pathWidth = DF.M.maxPath / 10 * 6 * k;
    if (GAME.canvas) {
        canvasContainer.removeChild(GAME.canvas);
    }
    GAME.canvas = document.createElement('canvas');
    GAME.canvas.width = winWidth;
    GAME.canvas.height = winHeight;
    GAME.context = GAME.canvas.getContext('2d');
    canvasContainer.appendChild(GAME.canvas);
    GAME.context.clearRect(0, 0, GAME.canvas.width, GAME.canvas.height);
    document.getElementById('timer').innerText = '';
    document.getElementById('miles').innerText = '';
    GAME.children = {};
    player = null;
    shadow = null;
    monsters = [];
    mileIndex = 0;
    cheerIndex = 1;
    asideMiles = [];
    shadow = new Shadow();
    player = new Player();
};
//========================================================================//
//============================= :: MAIN :: ===============================//
//========================================================================//
// 主函数
window.requestAnimationFrame = window.__requestAnimationFrame ||
    //
    window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
    //
    window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
    //
    window.msRequestAnimationFrame || (function() {
        return function(callback) {
            window.setTimeout(callback, 16);
        };
    })();
// 循环
var loop = function() {
    currTime = new Date().getTime();
    var runingTime = currTime - startTime;
    document.getElementById('timer').innerText = formatMilli(runingTime);
    document.getElementById('miles').innerText = gmfCounts;
    if (GameStatus != 3) {
        shadow.update();
        player.update();
        if (GameStatus != 1) {
            renderMonster();
            renderAsideMile();
            renderAsideCheer();
            renderAsideCheer2();
            GAME.updateChildren();
        }
        requestAnimationFrame(loop);
    } else {
        finishGame(formatMilli(runingTime), gmfCounts);
    }
};
var nextMonster = false,
    monIndex = 0,
    nextMonTime = null,
    currTime = null,
    noMoreMonster = false;
// 随机加载障碍
var renderMonster = function() {
    if (currTime > nextMonTime && nextMonster) {
        nextMonster = false;
    }
    if (!nextMonster && !noMoreMonster) {
        var randomTime = getRoundVal(500, 1000);
        var type = getRoundVal(0, DF.M.types.length + 4);
        if (type > DF.M.types.length - 1) {
            type = 0;
        }
        var pathIndex, pathWidth = winWidth / 3;
        if (type === 2) {
            pathIndex = getRoundVal(0, 1) === 0 ? 1 : 3;
            temp = new Monster(DF.M.types[type], pathIndex, pathWidth * 2, pathWidth, monIndex);
            temp.k = Math.abs((getScaleX(xlc) - pathWidth) / (winHeight - getScaleY(yl)));
        } else if (type === 4) {
            pathIndex = getRoundVal(1, 2);
            temp = new Monster(DF.M.types[type], pathIndex, pathWidth, pathWidth * 2, monIndex);
            temp.k = Math.abs((getScaleX(xl) - getScaleX(xd1)) / (winHeight - getScaleY(yl)));
            // temp.setAnchorPoint(0.5, 1);
        } else {
            pathIndex = getRoundVal(1, 2);
            temp = new Monster(DF.M.types[type], pathIndex, pathWidth / 3 * 2, pathWidth / 3 * 2 * 1.4, monIndex);
            temp.k = Math.abs((getScaleX(xl) - getScaleX(xd1)) / (winHeight - getScaleY(yl)));
        }
        nextMonTime = currTime + randomTime;
        monsters[monIndex] = temp;
        nextMonster = true;
        monIndex++;
    }
    for (var key in monsters) {
        monsters[key].update(player);
    }
};
var nextAsideMile = false,
    mileIndex = 0,
    nextMileTime = 0;
// 顺序加载数字
var renderAsideMile = function() {
    if (currTime >= nextMileTime && nextAsideMile) {
        nextAsideMile = false;
        mileIndex++;
    }
    if (!nextAsideMile) {
        if (DF.Miles[mileIndex]) {
            if (DF.Miles[mileIndex] === '100') {
                var finish = new Monster('zhongdian', 2, winWidth * 1.2, winWidth / 3, monIndex);
                monsters[monIndex] = finish;
                noMoreMonster = true;
                monIndex++;
            }
            nextMileTime = currTime + stepLength;
            var temp = new AsideMile(DF.Miles[mileIndex], 100, 100, mileIndex);
            temp.setAnchorPoint(1, 0);
            temp.setPosition(-10, winHeight);
            asideMiles[mileIndex] = temp;
            nextAsideMile = true;
        }
    }
    for (var key in asideMiles) {
        asideMiles[key].update();
    }
};
var nextAsideCheer = false,
    cheerIndex = 1,
    nextCheerTime = 0;
// 顺序加载数字
var renderAsideCheer = function() {
    if (currTime >= nextCheerTime && nextAsideCheer) {
        nextAsideCheer = false;
        cheerIndex++;
    }
    if (!nextAsideCheer) {
        nextCheerTime = currTime + stepLength / 4;
        var temp = new AsideCheer(cheerIndex % 2 == 0 ? 1 : 2, 1, 90, 160, cheerIndex);
        temp.setAnchorPoint(1, 1);
        var x = getRoundVal(0, 1) === 0 ? 0 : -20;
        temp.setPosition(x, winHeight);
        asideCheers[cheerIndex] = temp;
        nextAsideCheer = true;
    }
    for (var key in asideCheers) {
        asideCheers[key].update();
    }
};
var nextAsideCheer2 = false,
    cheerIndex2 = 1,
    nextCheerTime2 = 0;
// 顺序加载数字
var renderAsideCheer2 = function() {
    if (currTime >= nextCheerTime2 && nextAsideCheer2) {
        nextAsideCheer2 = false;
        cheerIndex2++;
    }
    if (!nextAsideCheer2) {
        nextCheerTime2 = currTime + stepLength / 4;
        var temp = new AsideCheer(cheerIndex2 % 2 == 0 ? 3 : 4, 2, 90, 160, cheerIndex2);
        temp.setAnchorPoint(0, 1);
        var x = getRoundVal(0, 1) === 0 ? 20 : 0;
        temp.setPosition(winWidth + x, winHeight);
        asideCheers2[cheerIndex2] = temp;
        nextAsideCheer2 = true;
    }
    for (var key in asideCheers2) {
        asideCheers2[key].update();
    }
};
//========================================================================//
//============================= :: UTIL :: ===============================//
//========================================================================//
// 获取随机数
var getRoundVal = function(base, round) {
    return (Math.round(Math.random() * round) + base);
};
// Stop Propagation
var stopPropagation = function(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    } else {
        e.cancelBubble = true;
    }
};
// formatMilli
var formatMilli = function(milli) {
    var s = parseInt(milli / 1000),
        m = milli % 1000;
    m = parseInt(m / 100);
    return s + '\'' + m; //(s < 10 ? '0' + s : s)
};
// formatMiles
var formatMiles = function(milli) {
    return parseInt(5 * milli / 1000) + 'm';
};
// 弹出框 参数(min:是否是小号, bgImg:背景图, mask:遮罩, content:内容, delay:延时自动关闭)
var dialog = function(options) {
    var dialog = $('#dialog');
    if (options.min) {
        dialog.css({
            top: '10%',
            height: '35%'
        });
    }
    if (options.bgImg) {
        options.mask = false;
        dialog.css('background-image', 'url(' + options.bgImg + ')');
    }
    if (options.mask) {
        dialog.find('.mask').show();
    } else {
        dialog.find('.mask').hide();
    }
    if (!options.hasClose) {
        dialog.css('background-image', 'url(' + options.bgImg + ')');
    }
    dialog.find('.content').html(options.content);
    dialog.show()
    if (options.delay) {
        setTimeout(function() {
            dialog.hide();
        }, options.delay)
    }
};
var popupTip = function(msg, f) {
    if (!f) {
        f = 'fc_re';
    }
    var id = 'tip' + new Date().getTime();
    var htmlContent = '<div id="' + id + '" class="crashTip self_center ' + f + '">' + msg + '</div>';
    $('#gameing').append(htmlContent);
    var top = $('#' + id).position().top;
    $('#' + id).css('top', top - winHeight / 1.6);
    setTimeout(function() {
        $('#' + id).remove();
    }, 1000);
};
//========================================================================//
//============================= :: AJAX :: ===============================//
//========================================================================//
//var service = 'http://ijita.me/game/';
var service = 'server/';
var executeAjax = function(opt) {
    $.ajax({
        url: opt.url,
        dataType: 'json',
        type: opt.method ? opt.method : 'POST',
        data: opt.data,
        success: opt.success,
        error: function(xhr, type) {
            dialog({
                content: 'SERVICES ERROR!',
                mask: true
            });
        }
    });
};
//检测授权码
var checkPassport = function(passport) {
    executeAjax({
        url: service + 'check.php',
        data: {
            passport: passport
        },
        success: function(data) {
            // data = data ? $.parseJSON(data) : null;
            if (data && data.ret === 0) {
                $('#checkPassport').hide();
            }
        }
    });
};
//加载玩家数
var loadPlayerCnt = function() {
    executeAjax({
        url: service + 'pcnt.php',
        method: 'GET',
        success: function(data) {
            // data = data ? $.parseJSON(data) : null;
            if (data && data.ret === 0) {
                $('#playerCount').text(data.cnt);
                $.fn.cookie('pcnt', data.cnt, {
                    expires: 7
                });
            }
        }
    });
};
// 游戏结束
var finishGame = function(timeCount, gmfCount) {
    var uid = $.fn.cookie('uid');
    var timeTik = parseFloat(timeCount.replace('\'', '.'));
    executeAjax({
        url: service + 'finish.php',
        data: {
            total_time: timeTik,
            gmf_times: gmfCount,
            uid: uid
        },
        success: function(data) {
            // data = data ? $.parseJSON(data) : null;
            if (data && data.ret === 0) {
                $.fn.cookie('uid', data.uid, {
                    expires: 7
                });
                document.getElementById('timeCount').innerText = timeCount;
                document.getElementById('gmfCount').innerText = gmfCount;
                document.getElementById('bestTime').innerText = data.total_time;
                document.getElementById('gmfCountAll').innerText = data.gmf_times;
                document.getElementById('currentRank').innerText = data.rank_id;
                document.getElementById('currentPersent').innerText = Math.round((data.pcnt - data.rank_id) / (data.pcnt) * 100);
                $('#gameAfter').show();
            }
        }
    });
};
// 提交信息
var submitInfo = function() {
    var phone = $('#phone').val();
    var userName = $('#userName').val();
    if (phone === '' || phone.length != 11) {
        dialog({
            content: '请填写您的信息以便我们能联系到您！',
            mask: true,
            min: true,
            delay: 2000
        });
        return false;
    }
    if (userName === '') {
        dialog({
            content: '请填写您的信息以便我们能联系到您！',
            mask: true,
            min: true,
            delay: 2000
        });
        return false;
    }
    var uid = $.fn.cookie('uid');
    executeAjax({
        url: service + 'info.php',
        data: {
            uid: uid,
            phone_no: phone,
            name: userName
        },
        success: function(data) {
            // data = data ? $.parseJSON(data) : null;
            if (data && data.ret === 0) {
                dialog({
                    content: '提交成功！',
                    mask: true,
                    min: true,
                    delay: 2000
                });
            }
        }
    });
};