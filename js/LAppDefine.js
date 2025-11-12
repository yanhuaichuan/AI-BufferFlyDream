var LAppDefine = {
   
    //这里配置canvsa元素的id
    CANVAS_ID: "live2d",

    //是否允许拖拽，默认为true
    IS_DRAGABLE: true,

    //绑定按钮元素id
    BUTTON_ID: "Change",

    TEXURE_BUTTON_ID: "texure",
    /**
     *  模型定义
        自定义配置模型，同一数组内放置同个模型的不同皮肤，换肤时按照顺序依次显示
        这里请用相对路径配置
     */
    MODELS: [
        ["model/seele/model.json"],
        ["model/illyasviel/illyasviel.model.json"],
        ["model/yiyier/mao_pro.model3.json"],
    ]
};


// 安全地获取canvas元素并添加事件监听器
var canvasElement = document.getElementById(LAppDefine.CANVAS_ID);
if (canvasElement && typeof canvasElement.addEventListener === 'function') {
    // 确保mouseEvent函数存在
    if (typeof mouseEvent === 'function') {
        canvasElement.addEventListener("click", mouseEvent, false);
        canvasElement.addEventListener("mousedown", mouseEvent, false);
        canvasElement.addEventListener("mouseup", mouseEvent, false);
        canvasElement.addEventListener("mousemove", mouseEvent, false);
    }
}

var isDragging = false;
var mouseOffsetx = 0;
var mouseOffsety = 0;
function mouseEvent(e) {
    e.preventDefault();
    // 先获取canvas元素并检查是否存在
    const canvas = document.getElementById(LAppDefine.CANVAS_ID);
    if (!canvas) return;
    
    if (e.type == "mousedown") {
        if ("button" in e && e.button != 0){
            return;
        }
        isDragging = true;
        mouseOffsetx = e.pageX - canvas.offsetLeft;
        mouseOffsety = e.pageY - canvas.offsetTop;
    } else if (e.type == "mousemove") {
        if(isDragging == true) {
            var movex = e.pageX - mouseOffsetx;
            var movey = e.pageY - mouseOffsety;
            if(movex > window.innerWidth - canvas.width)
                movex = window.innerWidth - canvas.width;
            if(movex < 0) movex = 0;
            if(movey > window.innerHeight - canvas.height)
                movey = window.innerHeight - canvas.height;
            if(movey < 0) movey = 0;
            if(LAppDefine.IS_DRAGABLE) {
                canvas.style.left = movex + "px";
                canvas.style.top = movey + "px";
            }
        }
    } else if (e.type == "mouseup") {
        if ("button" in e && e.button != 0) return;
        isDragging = false;
    }
}
