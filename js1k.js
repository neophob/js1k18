

// ---------------------------------------------
// Viewer information

var camera =
{
    x:        512., // x position on the map
    y:        800., // y position on the map
    height:    78., // height of the camera
    angle:      0., // direction of the camera
    horizon:  100., // horizon position (look up and down)
    distance: 800   // distance of map
};

// ---------------------------------------------
// Landscape data

var map =
{
    height: new Uint8Array(1024*1024), // 1024*1024 byte array with height information
    color:  new Uint32Array(1024*1024) // 1024*1024 int array with RGB colors
};

// ---------------------------------------------
// Screen data

var screen =
{
    canvas:    null,
    context:   null,
    imagedata: null,

    bufarray:  null, // color data
    buf8:      null, // the same array but with bytes
    buf32:     null, // the same array but with 32-Bit words

    backgroundcolor: 0xFFE09090
};

// ---------------------------------------------
// Keyboard and mouse interaction

var input =
{
    forwardbackward: 0,
    leftright:       0,
    updown:          0,
    lookup:          false,
    lookdown:        false,
    mouseposition:   null,
    keypressed:      false
}

var updaterunning = false;

var time = new Date().getTime();


// for fps display
var timelastframe = new Date().getTime();
var frames = 0;

// Update the camera for next frame. Dependent on keypresses
function UpdateCamera()
{
    var current = new Date().getTime();

    input.keypressed = false;
    if (input.leftright != 0)
    {
        camera.angle += input.leftright*0.1*(current-time)*0.03;
        input.keypressed = true;
    }
    if (input.forwardbackward != 0)
    {
        camera.x -= input.forwardbackward * Math.sin(camera.angle) * (current-time)*0.03;
        camera.y -= input.forwardbackward * Math.cos(camera.angle) * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.updown != 0)
    {
        camera.height += input.updown * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.lookup)
    {
        camera.horizon += 2 * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.lookdown)
    {
        camera.horizon -= 2 * (current-time)*0.03;
        input.keypressed = true;
    }

    // Collision detection. Don't fly below the surface.
    var mapoffset = ((Math.floor(camera.y) & 1023) << 10) + (Math.floor(camera.x) & 1023)|0;
    if ((map.height[mapoffset]+10) > camera.height) camera.height = map.height[mapoffset] + 10;

    time = current;

}

// ---------------------------------------------
// Keyboard and mouse event handlers

function DetectMouseDown(e)
{
    input.forwardbackward = 3.;
    input.mouseposition = [e.pageX, e.pageY];
    time = new Date().getTime();

    if (!updaterunning) Draw();
    return;
}

function DetectMouseUp()
{
    input.mouseposition = null;
    input.forwardbackward = 0;
    input.leftright = 0;
    input.updown = 0;
    return;
}

function DetectMouseMove(e)
{
    e.preventDefault();
    if (input.mouseposition == null) return;
    if (input.forwardbackward == 0) return;

    input.leftright = (input.mouseposition[0]-e.pageX)*1e-3;
    camera.horizon  = 100 + (input.mouseposition[1]-e.pageY)*0.5;
    input.updown    = (input.mouseposition[1]-e.pageY)*1e-2;
}


function DetectKeysDown(e)
{
    switch(e.keyCode)
    {
    case 37:    // left cursor
    case 65:    // a
        input.leftright = +1.;
        break;
    case 39:    // right cursor
    case 68:    // d
        input.leftright = -1.;
        break;
    case 38:    // cursor up
    case 87:    // w
        input.forwardbackward = 3.;
        break;
    case 40:    // cursor down
    case 83:    // s
        input.forwardbackward = -3.;
        break;
    case 82:    // r
        input.updown = +2.;
        break;
    case 70:    // f
        input.updown = -2.;
        break;
    case 69:    // e
        input.lookup = true;
        break;
    case 81:    //q
        input.lookdown = true;
        break;
    default:
        return;
        break;
    }

    if (!updaterunning) {
        time = new Date().getTime();
        Draw();
    }
    return false;
}

function DetectKeysUp(e)
{
    switch(e.keyCode)
    {
    case 37:    // left cursor
    case 65:    // a
        input.leftright = 0;
        break;
    case 39:    // right cursor
    case 68:    // d
        input.leftright = 0;
        break;
    case 38:    // cursor up
    case 87:    // w
        input.forwardbackward = 0;
        break;
    case 40:    // cursor down
    case 83:    // s
        input.forwardbackward = 0;
        break;
    case 82:    // r
        input.updown = 0;
        break;
    case 70:    // f
        input.updown = 0;
        break;
    case 69:    // e
        input.lookup = false;
        break;
    case 81:    //q
        input.lookdown = false;
        break;
    default:
        return;
        break;
    }
    return false;
}

// ---------------------------------------------
// Fast way to draw vertical lines

function DrawVerticalLine(x, ytop, ybottom, col)
{
    x = x|0;
    ytop = ytop|0;
    ybottom = ybottom|0;
    col = col|0;
    var buf32 = screen.buf32;
    var screenwidth = screen.canvas.width|0;
    if (ytop < 0) ytop = 0;
    if (ytop > ybottom) return;

    // get offset on screen for the vertical line
    var offset = ((ytop * screenwidth) + x)|0;
    for (var k = ytop|0; k < ybottom|0; k=k+1|0)
    {
        buf32[offset|0] = col|0;
        offset = offset + screenwidth|0;
    }
}

// ---------------------------------------------
// Basic screen handling

function DrawBackground()
{
    var buf32 = screen.buf32;
    var color = screen.backgroundcolor|0;
    for (var i = 0; i < buf32.length; i++) buf32[i] = color|0;
}

// Show the back buffer on screen
function Flip()
{
    screen.imagedata.data.set(screen.buf8);
    screen.context.putImageData(screen.imagedata, 0, 0);
}

// ---------------------------------------------
// The main render routine

function Render()
{
    var screenwidth = screen.canvas.width|0;
    var sinang = Math.sin(camera.angle);
    var cosang = Math.cos(camera.angle);

    var hiddeny = new Int32Array(screenwidth);
    for(var i=0; i<screen.canvas.width|0; i=i+1|0)
        hiddeny[i] = screen.canvas.height;

    var dz = 1.;

    // Draw from front to back
    for(var z=1; z<camera.distance; z+=dz)
    {
        // 90 degree field of view
        var plx =  -cosang * z - sinang * z;
        var ply =   sinang * z - cosang * z;
        var prx =   cosang * z - sinang * z;
        var pry =  -sinang * z - cosang * z;

        var dx = (prx - plx) / screenwidth;
        var dy = (pry - ply) / screenwidth;
        plx += camera.x;
        ply += camera.y;
        var invz = 1. / z * 240.;
        for(var i=0; i<screenwidth|0; i=i+1|0)
        {
            var mapoffset = ((Math.floor(ply) & 1023) << 10) + (Math.floor(plx) & 1023)|0;
            var heightonscreen = (camera.height - map.height[mapoffset]) * invz + camera.horizon|0;
            DrawVerticalLine(i, heightonscreen, hiddeny[i], map.color[mapoffset]);
            if (heightonscreen < hiddeny[i]) hiddeny[i] = heightonscreen;
            plx += dx;
            ply += dy;
        }
    }
    dz += 0.01;
}


// ---------------------------------------------
// Draw the next frame

function Draw()
{
    updaterunning = true;
    UpdateCamera();
    DrawBackground();
    Render();
    Flip();
    frames++;

    if (!input.keypressed)
    {
        updaterunning = false;
    } else
    {
        window.setTimeout(Draw, 0);
    }
}

// ---------------------------------------------
// Init routines

// Util class for downloading the png
function DownloadImagesAsync(urls, OnSuccess) {
    var pending = urls.length;
    var result = [];
    if (pending === 0) {
        setTimeout(onsuccess.bind(null, result), 0);
        return;
    }
    urls.forEach(function(url, i) {
        var image = new Image();
        //image.addEventListener("load", function() {
        image.onload = function() {
            var tempcanvas = document.createElement("canvas");
            var tempcontext = tempcanvas.getContext("2d");
            tempcanvas.width = 1024;
            tempcanvas.height = 1024;
            tempcontext.drawImage(image, 0, 0, 1024, 1024 );

            result[i] = tempcontext.getImageData(0, 0, 1024, 1024).data;
            pending--;
            if (pending === 0) {
                OnSuccess(result);
            }
        };
        image.src = url;
        image.crossOrigin = "Anonymous";

    });
}

function LoadMap(filenames)
{
   var files = filenames.split(";");
//   DownloadImagesAsync(["maps/"+files[0]+".png", "maps/"+files[1]+".png"], OnLoadedImages);
   DownloadImagesAsync(["https://raw.githubusercontent.com/s-macke/VoxelSpace/master/maps/"+files[0]+".png", "https://raw.githubusercontent.com/s-macke/VoxelSpace/master/maps/"+files[1]+".png"], OnLoadedImages);
}

function OnLoadedImages(result)
{
    var datac = result[0];
    var datah = result[1];
    for(var i=0; i<1024*1024; i++)
    {
        map.color[i] = 0xFF000000 | (datac[(i<<2) + 2] << 16) | (datac[(i<<2) + 1] << 8) | datac[(i<<2) + 0];
        map.height[i] = datah[i<<2];
    }
    Draw();
}

function OnResizeWindow()
{
    screen.canvas = window.a;

    var aspect = window.innerWidth / window.innerHeight;

    screen.canvas.width = window.innerWidth<800?window.innerWidth:800;
    screen.canvas.height = screen.canvas.width / aspect;

    if (screen.canvas.getContext)
    {
        screen.context = screen.canvas.getContext('2d');
        screen.imagedata = screen.context.createImageData(screen.canvas.width, screen.canvas.height);
    }

    screen.bufarray = new ArrayBuffer(screen.imagedata.width * screen.imagedata.height * 4);
    screen.buf8     = new Uint8Array(screen.bufarray);
    screen.buf32    = new Uint32Array(screen.bufarray);
    Draw();
}

function Init()
{
    for(var i=0; i<1024*1024; i++)
    {
        map.color[i] = 0xFF007050;
        map.height[i] = 0;
    }

    LoadMap("C1W;D1");
    OnResizeWindow();

    // set event handlers for keyboard, mouse, touchscreen and window resize
    document.onkeydown    = DetectKeysDown;
    document.onkeyup      = DetectKeysUp;
    document.onmousedown  = DetectMouseDown;
    document.onmouseup    = DetectMouseUp;
    document.onmousemove  = DetectMouseMove;
    document.ontouchstart = DetectMouseDown;
    document.ontouchend   = DetectMouseUp;
    document.ontouchmove  = DetectMouseMove;
    window.onresize       = OnResizeWindow;

    window.setInterval(function(){
        var current = new Date().getTime();
        console.log('fps:', (frames / (current-timelastframe) * 1000).toFixed(1));
        frames = 0;
        timelastframe = current;
    }, 2000);

}

Init();
