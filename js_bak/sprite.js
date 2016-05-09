var GAME = GAME || {};
// ===================================================
// =====================::GLOBAL::====================
// ===================================================
var WIDTH = 720,
    HEIGHT = 1280;
var xl = 310,
    xlc = 334.5,
    yl = 308,
    xr = 408,
    xA = 290;
var xd1 = 128,
    xd2 = 592;
var getScaleX = function(x) {
    return winWidth * x / WIDTH;
};
var getScaleY = function(y) {
    return winHeight * y / HEIGHT;
};
/// ==================================================
GAME.children = {};
GAME.childCount = 0;
GAME.updateChildren = function() {
    if (GAME.childCount > 0) {
        GAME.context.clearRect(0, 0, GAME.canvas.width, GAME.canvas.height);
        var zorderList = [];
        for (var k in GAME.children) {
            var child = GAME.children[k];
            zorderList.push({
                sprite: child,
                zorder: child.zorder
            });
        };
        zorderList.sort(function(a, b) {
            return a.zorder >= b.zorder ? 1 : -1;
        });
        for (var i = 0; i < zorderList.length; ++i) {
            var child = zorderList[i].sprite;
            GAME.context.drawImage(child.image, child.pos.x, child.pos.y, child.width * child.scale.x, child.height * child.scale.y);
        };
    }
};
GAME.getDistance = function(pointA, pointB) {
    return Math.sqrt(Math.pow(pointA.x - pointB.x, 2), Math.pow(pointA.y - pointB.y, 2))
};
// ===================================================
// =====================::Sprite::====================
// ===================================================
GAME.Sprite = function(tag, src, width, height, zorder) {
        for (var key in GAME.Sprite.prototype) {
            this.__proto__[key] = GAME.Sprite.prototype[key];
        }
        this.tag = tag;
        this.zorder = zorder || 0;
        this.src = src;
        this.width = width;
        this.height = height;
        //锚点
        this.anchor = {
            x: 0.5,
            y: 0.5
        };
        //左上点坐标
        this.pos = {
            x: 0,
            y: 0
        };
        //缩放比
        this.scale = {
            x: 1,
            y: 1
        };
        //Sprite的图像
        this.image = new Image();
        this.image.src = this.src;
        var self = this;
        this.image.onload = function() {
            GAME.children[tag] = self;
            GAME.childCount++;
            GAME.updateChildren();
        };
    }
    //移除自身
GAME.Sprite.prototype.removeFromGlobal = function() {
    if (GAME.children[this.tag] == undefined) {
        console.log("tag:", this.tag, "isnot exists");
        return;
    }
    delete GAME.children[this.tag];
    GAME.childCount--;
};
//设置锚点
GAME.Sprite.prototype.setAnchorPoint = function(x, y) {
    if (x > 1 || x < 0 || y > 1 || y < 0) {
        console.log("AnchorPoint must between [0, 1]");
    };
    this.anchor.x = x;
    this.anchor.y = y;
};
//设置锚点坐标 即间接设定左上点坐标
GAME.Sprite.prototype.setPosition = function(x, y) {
    this.pos.x = x - this.anchor.x * this.width * this.scale.x;
    this.pos.y = y - this.anchor.y * this.height * this.scale.y;
};
//设置锚点X坐标 即间接设定左上点坐标
GAME.Sprite.prototype.setPositionX = function(x) {
    this.pos.x = x - this.anchor.x * this.width * this.scale.x;
};
//设置锚点Y坐标 即间接设定左上点坐标
GAME.Sprite.prototype.setPositionY = function(y) {
    this.pos.y = y - this.anchor.y * this.height * this.scale.y;
};
//获取锚点X坐标
GAME.Sprite.prototype.getPositionX = function() {
    return this.pos.x + this.anchor.x * this.width * this.scale.x;
};
//获取锚点Y坐标
GAME.Sprite.prototype.getPositionY = function() {
    return this.pos.y + this.anchor.y * this.height * this.scale.y;
};
//根据锚点进行缩放，由于drawImage是以左上点为原点，所以这里需要根据相应情况对左上点进行偏移
GAME.Sprite.prototype.setScale = function(scaleX, scaleY) {
    var delta_x = this.width * (this.scale.x - scaleX) * this.anchor.x;
    var delta_y = this.height * (this.scale.y - scaleY) * this.anchor.y;
    this.pos.x += delta_x;
    this.pos.y += delta_y;
    this.scale.x = scaleX;
    this.scale.y = scaleY;
};
//
GAME.Sprite.prototype.getCurrentWidth = function() {
    return this.width * this.scale.x;
}
GAME.Sprite.prototype.getCurrentHeight = function() {
    return this.height * this.scale.y;
}