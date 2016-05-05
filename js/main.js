var isWeixinBrowser = function() {
    var ua = navigator.userAgent.toLowerCase();
    return (/micromessenger/.test(ua)) ? true : false;
}
if (!isWeixinBrowser()) {
    // $('body').html('Give me five!');
}
// ========================================================================//
// ============================= :: INIT :: ===============================//
// ========================================================================//
var canvasContainer, GameStatus = 0; // 游戏状态(-1未开始，0进行中，1暂停，2碰撞，3已结束)
var player, shadow, monsters = [],
    asideMiles = [],
    asideCheers = [],
    asideCheers2 = [];
var winWidth, winHeight, guideStatus = 0,
    isGuide = false;
var startTouchPoint, touchCacheX = 0.12,
    touchCacheY = 0.2;
var startTime, pauseTime, gmfCounts = 0,
    stepLength = 1800;
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
        musicBg.play();
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
        resetStage(); // 重置舞台
        if (isPlayMusic) {
            musicBg.play();
        }
        startGame();
        stopPropagation(event);
    }).on('touchstart', '#btnTopTen', function(event) {
        loadGamerTop10();
        event.preventDefault();
    }).on('touchstart', '#btnRaffle', function(event) {
        loadGamerRaffle();
        event.preventDefault();
    });
    $('#inputBox').on('touchstart', '#submitInfo', function(event) {
        submitInfo();
        event.preventDefault();
    });
    $('.dialog_navbar').on('touchstart', '.dialog_navbar_item', function(event) {
        $(this).siblings('.dialog_navbar_item').removeClass('selected')
        $(this).addClass('selected');
        $(this).parent().siblings('div').hide();
        $(this).parent().siblings('div').eq($(this).index()).show();
    });
    $('.dialog_navbar').find('.dialog_navbar_item').eq(1).hide();
    isGuide = $.fn.cookie('isGuide');
});
// 引导页
var showGuide = function(index) {
    var myTouch = util.toucher(document.getElementById('guide'));
    var len = winHeight > winWidth ? winWidth : winHeight;
    var isFinished = false;
    myTouch.on('swipe', function(e) {
        var guideIndex = $('#guide').data('index');
        if (e.moveX >= len * touchCacheX && guideIndex != 2) { // right
            if (!player.moving && !player.jumping) {
                player.moving = true;
                player.moveDirect = 1;
                shadow.moving = true;
                shadow.moveDirect = 1;
                isFinished = true;
            }
        } else if (e.moveX <= -len * touchCacheX && guideIndex != 2) { // left
            if (!player.moving && !player.jumping) {
                player.moving = true;
                player.moveDirect = -1;
                shadow.moving = true;
                shadow.moveDirect = -1;
                isFinished = true;
            }
        }
        if (e.moveY <= -len * touchCacheY && guideIndex == 2) { // up
            if (!player.jumping) {
                player.jumping = true;
                player.jumpDirect = 1;
                isFinished = true;
            }
        }
        if (isFinished) {
            $('#guide').hide();
            GameStatus = 0;
            guideStatus = 2;
            if (guideIndex >= 3) {
                nextMonTime = currTime + 1000;
                isGuide = true;
                guideStatus = -1;
                startTime = new Date().getTime();
                $.fn.cookie('isGuide', isGuide, {
                    expires: 120
                });
            } else {
                nextMonTime = currTime + 1200;
                setTimeout(function() {
                    guideStatus = 0;
                }, 1200);
            }
            isFinished = false;
        }
        stopPropagation(e);
    });
    if (index === 1) {
        var container = $('#guide').find('.container');
        container.addClass('guide_bg_1').find('article').text('');
        $('#guide').show();
    } else if (index === 2) {
        var container = $('#guide').find('.container');
        container.removeClass('guide_bg_1').addClass('guide_bg_2').find('article').text('');
        $('#guide').show();
    } else {
        var container = $('#guide').find('.container');
        container.removeClass('guide_bg_2').addClass('guide_bg_1').find('article').html('GIME ME FIVE！<br/>给市运会加油！<br/>');
        $('#guide').show();
    }
    $('#guide').data('index', index);
};
// 初始化舞台
var initStage = function() {
    canvasContainer = document.getElementById('gameing');
    window.onresize = resizeHandler;
    resetStage(); // 重置舞台
    var myTouch = util.toucher(document.getElementById('gameing'));
    var len = winHeight > winWidth ? winWidth : winHeight;
    myTouch.on('swipe', function(e) {
        if (isGuide) {
            if (e.moveX >= len * touchCacheX) { // right
                if (!player.moving && !player.jumping) {
                    player.moving = true;
                    player.moveDirect = 1;
                    shadow.moving = true;
                    shadow.moveDirect = 1;
                }
            } else if (e.moveX <= -len * touchCacheX) { // left
                if (!player.moving && !player.jumping) {
                    player.moving = true;
                    player.moveDirect = -1;
                    shadow.moving = true;
                    shadow.moveDirect = -1;
                }
            }
            if (e.moveY <= -len * touchCacheY) { // up
                if (!player.jumping) {
                    player.jumping = true;
                    player.jumpDirect = 1;
                }
            }
        }
        stopPropagation(e);
    });
    startGame();
};
var startGame = function() {
    startTime = new Date().getTime();
    gmfCounts = 0;
    DF.AddTime = 1;
    noMoreMonster = false;
    GameStatus = 0;
    requestAnimationFrame(loop, canvasContainer);
};
// 改变窗口尺寸
var resizeHandler = function() {
    resetStage();
};
// 重置舞台
var resetStage = function() {
    winWidth = $(canvasContainer).width();
    winHeight = $(canvasContainer).height();
    DF.M.maxPath = getScaleY(HEIGHT - yl - 25);
    DF.M.maxPathMile = getScaleY(HEIGHT - yl - 25);
    DF.M.moveSpeed = winHeight * 0.0068;
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
    asideMiles = [];
    asideCheers = [];
    asideCheers2 = []
    mileIndex = 0;
    mileIndex = 0;
    cheerIndex = 1;
    cheerIndex2 = 1;
    shadow = new Shadow();
    player = new Player();
};
// ========================================================================//
// ============================= :: MAIN :: ===============================//
// ========================================================================//
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
    if (guideStatus == 2 && pauseTime > 0) {
        startTime += currTime - pauseTime + 100;
        pauseTime = 0;
    }
    if (guideStatus != 1) {
        var runingTime = currTime - startTime;
        document.getElementById('timer').innerText = formatMilli(runingTime);
        document.getElementById('miles').innerText = gmfCounts;
    }
    if (GameStatus != 3) {
        shadow.update();
        player.update();
        if (GameStatus != 1) {
            renderMonster();
            if (isGuide) {
                renderAsideMile();
                renderAsideCheer();
                renderAsideCheer2();
            }
            GAME.updateChildren();
        }
        requestAnimationFrame(loop);
    } else {
        musicBg.pause();
        if (isPlayMusic) {
            musicWin.play();
        }
        finishGame(formatMilli(runingTime), gmfCounts);
    }
};
var nextMonster = false,
    monIndex = 0,
    nextMonTime = null,
    currTime = null,
    noMoreMonster = false;
var guideSortIndex = [4, 2, 0];
// 随机加载障碍
var renderMonster = function() {
    if (currTime > nextMonTime && nextMonster) {
        nextMonster = false;
    }
    if (!nextMonster && !noMoreMonster && isGuide) {
        var randomTime = getRoundVal(500, 1000);
        var type = getRoundVal(0, DF.M.types.length + 3);
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
    if (!nextMonster && !noMoreMonster && !isGuide) {
        var pathWidth = winWidth / 3,
            type = guideSortIndex[monIndex],
            w = pathWidth / 3 * 2,
            h = pathWidth / 3 * 2 * 1.4;
        if (type === 2) {
            w = pathWidth * 2, h = pathWidth;
            var temp = new Monster(DF.M.types[type], player.pathIndex, w, h, monIndex);
            temp.k = Math.abs((getScaleX(xlc) - pathWidth) / (winHeight - getScaleY(yl)));
        } else if (type === 4) {
            w = pathWidth, h = pathWidth * 2;
            var temp = new Monster(DF.M.types[type], 2, w, h, monIndex);
            temp.k = Math.abs((getScaleX(xl) - getScaleX(xd1)) / (winHeight - getScaleY(yl)));
        } else {
            var temp = new Monster(DF.M.types[type], 2, w, h, monIndex);
            temp.k = Math.abs((getScaleX(xl) - getScaleX(xd1)) / (winHeight - getScaleY(yl)));
        }
        monsters[monIndex] = temp;
        nextMonTime = currTime + 1e6;
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
                var finish = new Monster('zhongdian', 2, getScaleX(720) * 1.2, getScaleY(882) * 1.2, cheerIndex + 100);
                finish.setAnchorPoint(0.5, 1);
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
// 左边啦啦队
var renderAsideCheer = function() {
    if (currTime >= nextCheerTime && nextAsideCheer) {
        nextAsideCheer = false;
        cheerIndex++;
    }
    if (!nextAsideCheer) {
        nextCheerTime = currTime + stepLength / 4;
        var temp = new AsideCheer(getRoundVal(1, 2), 1, 90, 160, cheerIndex);
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
// 右边啦啦队
var renderAsideCheer2 = function() {
    if (currTime >= nextCheerTime2 && nextAsideCheer2) {
        nextAsideCheer2 = false;
        cheerIndex2++;
    }
    if (!nextAsideCheer2) {
        nextCheerTime2 = currTime + stepLength / 4;
        var temp = new AsideCheer(getRoundVal(4, 2), 2, 100, 120, cheerIndex2);
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
// ========================================================================//
// ============================= :: UTIL :: ===============================//
// ========================================================================//
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
    return s + '\'' + m; // (s < 10 ? '0' + s : s)
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
            top: '0%',
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
// ========================================================================//
// ============================= :: AJAX :: ===============================//
// ========================================================================//
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
// 检测授权码
var checkPassport = function(passport) {
    executeAjax({
        url: service + 'check.php',
        data: {
            passport: passport
        },
        success: function(data) {
            if (data && data.ret === 0) {
                $('#checkPassport').hide();
            }
        }
    });
};
// 加载玩家数
var loadPlayerCnt = function() {
    executeAjax({
        url: service + 'pcnt.php',
        method: 'GET',
        success: function(data) {
            if (data && data.ret === 0) {
                $('#playerCount').text(data.cnt);
                $.fn.cookie('pcnt', data.cnt, {
                    expires: 7
                });
            }
        }
    });
    loadGamerGift();
    var hasRaffle = $.fn.cookie('hasRaffle');
    if (hasRaffle != null && hasRaffle == 1) {
        $('#btnRaffle').hide(); // 如果抽过奖即隐藏抽奖按钮
    }
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
                if (data && data.ret === 0) {
                    $.fn.cookie('uid', data.uid, {
                        expires: 120
                    });
                    document.getElementById('uid').innerText = data.uid;
                    document.getElementById('timeCount').innerText = timeCount;
                    document.getElementById('gmfCount').innerText = gmfCount;
                    document.getElementById('bestTime').innerText = formatMilli(data.total_time * 1000);
                    document.getElementById('gmfCountAll').innerText = data.gmf_times;
                    document.getElementById('currentPersent').innerText = Math.round((data.pcnt - data.rank_id) / (data.pcnt) * 100);
                    $('#currSort').text(data.rank_id);
                    $('#gameAfter').show();
                }
            }
        });
    },
    loadGamerTop10 = function() {
        var uid = $.fn.cookie('uid');
        var uPhone = $.fn.cookie('uPhone');
        if (uPhone != null) {
            $('.dialog_navbar').find('.dialog_navbar_item').eq(1).show().trigger('touchstart');
            executeAjax({
                url: service + 'top10.php',
                data: {
                    uid: uid
                },
                success: function(data) {
                    if (data && data.ret === 0) {
                        var htmlContent = '',
                            dataVal = data.top10;
                        for (var i = 0; i < dataVal.length; i++) {
                            var temp = dataVal[i];
                            htmlContent += '<tr><td>No.' + (i + 1) + '</td><td>' + fmtNull(temp['name']) + '</td><td>' + fmtNull(temp['phone_no']) + '</td>\
                                        <td>' + temp['total_time'] + '</td><td>' + temp['gmf_times'] + '</td></tr>';
                        }
                        $('#topTenBody').html(htmlContent);
                        $('#activity').show();
                    }
                }
            });
        } else {
            // 设置后续动作为 1 排行榜
            $('#inputBox').data('todo', 1).show();
        }
    },
    fmtNull = function(value) {
        return value && value != undefined ? value : '暂无';
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
        if (userName === '' || userName.length > 16) {
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
                if (data && data.ret === 0) {
                    dialog({
                        content: '提交成功！',
                        mask: true,
                        min: true,
                        delay: 2000
                    });
                    $.fn.cookie('uPhone', phone, {
                        expires: 120
                    });
                    // 后续动作
                    var todo = $('#inputBox').data('todo');
                    if (todo && todo == 1) {
                        loadGamerTop10();
                    } else if (todo && todo == 2) {
                        loadGamerRaffle();
                    }
                }
            }
        });
    },
    loadGamerRaffle = function() {
        var uPhone = $.fn.cookie('uPhone');
        if (uPhone != null) {
            var uid = $.fn.cookie('uid');
            executeAjax({
                url: service + 'gift.php',
                data: {
                    uid: uid
                },
                success: function(data) {
                    if (data && data.ret === 0) {
                        if (data.win === 1) {
                            dialog({
                                content: '恭喜您中奖啦！请到兑奖说明中查看详情！',
                                mask: true,
                                min: true,
                                delay: 5000
                            });
                        } else {
                            dialog({
                                content: '很遗憾，您没有抽到奖！',
                                mask: true,
                                min: true,
                                delay: 5000
                            });
                        }
                        setGiftImage(data.win === 1);
                    }
                    $.fn.cookie('hasRaffle', 1, {
                        expires: 120
                    });
                    $('#btnRaffle').hide();
                    $('#inputBox').data('todo', 0).hide();
                }
            });
        } else {
            // 设置后续动作为 2 抽奖
            $('#inputBox').data('todo', 2).show();
        }
    },
    loadGamerGift = function() {
        var uid = $.fn.cookie('uid');
        if (uid) {
            executeAjax({
                url: service + 'win.php',
                data: {
                    uid: uid
                },
                success: function(data) {
                    if (data && data.ret === 0) {
                        setGiftImage(data.win === 1);
                    }
                }
            });
        } else {
            setGiftImage(false);
        }
    },
    setGiftImage = function(win) {
        var image = $('#giftImage').find('img');
        if (win) {
            image.before('恭喜您中奖啦！');
            image.attr('src', 'images/jiayou_2.png');
        } else {
            image.before('暂无奖品！');
            image.attr('src', 'images/jiayou_1.png');
        }
    };