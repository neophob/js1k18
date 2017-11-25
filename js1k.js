

// ---------------------------------------------
// Viewer information

var camera =
{
    x:        512, // x position on the map
    y:        800, // y position on the map
    height:    78, // height of the camera
    angle:      0, // direction of the camera
    horizon:  100, // horizon position (look up and down)
    distance: 800   // distance of map
};

// ---------------------------------------------
// Landscape data

var heightmap, colormap; // 1024*1024 byte array with height information
// ---------------------------------------------
// Screen data

var buf8, buf32, imagedata, context;

// ---------------------------------------------
// Keyboard and mouse interaction

var input =
{
    forwardbackward: 0,
    leftright:       0,
    updown:          0,
    mouseposition:   null,
    keypressed:      false
}

var updaterunning = 0;
var time = 0;


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
/*    if (input.lookup)
    {
        camera.horizon += 2 * (current-time)*0.03;
        input.keypressed = true;
    }
/*    if (input.lookdown)
    {
        camera.horizon -= 2 * (current-time)*0.03;
        input.keypressed = true;
    }*/

    // Collision detection. Don't fly below the surface.
    var mapoffset = ((Math.floor(camera.y) & 1023) << 10) + (Math.floor(camera.x) & 1023)|0;
    if ((heightmap[mapoffset]+10) > camera.height) camera.height = heightmap[mapoffset] + 10;

    time = current;

}


// ---------------------------------------------
// Fast way to draw vertical lines

function DrawVerticalLine(x, ytop, ybottom, col) {
    x = x;
    ytop = ytop;
    ybottom = ybottom;
    col = col;
    var screenwidth = a.width;
    if (ytop < 0) ytop = 0;
    if (ytop > ybottom) return;

    // get offset on screen for the vertical line
    var offset = ((ytop * screenwidth) + x);
    for (var k = ytop; k < ybottom|0; k++)
    {
        buf32[offset] = col;
        offset = offset + screenwidth;
    }
}

// ---------------------------------------------
// The main render routine

function Render()
{
    var screenwidth = a.width|0;
    var sinang = Math.sin(camera.angle);
    var cosang = Math.cos(camera.angle);

    var hiddeny = new Int32Array(screenwidth);
    for(var i=0; i<a.width|0; i=i+1|0)
        hiddeny[i] = a.height;

    var dz = 1.;

    // Draw from front to back
    for (var z=1; z<camera.distance; z+=dz)
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
            var heightonscreen = (camera.height - heightmap[mapoffset]) * invz + camera.horizon|0;
            DrawVerticalLine(i, heightonscreen, hiddeny[i], colormap[mapoffset]);
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

    // DrawBackground
    var color = 0xFFE09090
    for (var i = 0; i < buf32.length; i++) buf32[i] = color;

    Render();

    // Flip, Show the back buffer on screen
    imagedata.data.set(buf8);
    context.putImageData(imagedata, 0, 0);

    if (!input.keypressed) {
      updaterunning = false;
    } else {
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

function OnLoadedImages(result)
{
    var datac = result[0];
    var datah = result[1];
    for(var i=0; i<1024*1024; i++)
    {
        colormap[i] = 0xFF000000 | (datac[(i<<2) + 2] << 16) | (datac[(i<<2) + 1] << 8) | datac[(i<<2) + 0];
        heightmap[i] = datah[i<<2];
    }
    Draw();
}

function OnResizeWindow() {
    var aspect = window.innerWidth / window.innerHeight;

    a.width = window.innerWidth<800?window.innerWidth:800;
    a.height = a.width / aspect;

    if (a.getContext)
    {
        context = a.getContext('2d');
        imagedata = context.createImageData(a.width, a.height);
    }

    var bufarray = new ArrayBuffer(imagedata.width * imagedata.height * 4);
    buf8   = new Uint8Array(bufarray);
    buf32  = new Uint32Array(bufarray);
    Draw();
}

function Init() {
    heightmap = new Uint8Array(1024*1024);
    colormap = new Uint32Array(1024*1024) // 1024*1024 int array with RGB colors
    for (var i=0; i<1024*1024; i++) {
      colormap[i] = 0xFF007050;
      heightmap[i] = 0;
    }

    // LOAD MAP
    DownloadImagesAsync(["https://raw.githubusercontent.com/s-macke/VoxelSpace/master/maps/C1W.png", "https://raw.githubusercontent.com/s-macke/VoxelSpace/master/maps/D1.png"], OnLoadedImages);
    OnResizeWindow();

    // set event handlers for keyboard, mouse, touchscreen and window resize
    document.onmousedown = (e) => {
      input.forwardbackward = 3;
      input.mouseposition = [e.pageX, e.pageY];
      time = new Date().getTime();
      if (!updaterunning) Draw();
    };

    document.onmouseup = () => {
      input.mouseposition = null;
      input.forwardbackward = 0;
      input.leftright = 0;
      input.updown = 0;
    }

    document.onmousemove  = (e) => {
      if (input.mouseposition == null || input.forwardbackward == 0) return;
      input.leftright = (input.mouseposition[0]-e.pageX)*1e-3;
      camera.horizon  = 100 + (input.mouseposition[1]-e.pageY)*0.5;
      input.updown    = (input.mouseposition[1]-e.pageY)*1e-2;
    }

    window.onresize       = OnResizeWindow;
}

Init();
