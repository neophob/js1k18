// based on https://github.com/s-macke/VoxelSpace

(() => {

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
/*
var input =
{
    forwardbackward: 0,
    leftright:       0,
    updown:          0,
    mouseposition:   null,
    keypressed:      false
}
*/
var time = 0;

//var pallete = [0xff113231, 0xff6E612D, 0xffFFD38C];
var pallete = [0xff113231, 0xff2d616e, 0xffFFD38C];


// Update the camera for next frame. Dependent on keypresses
function UpdateCamera()
{
    var current = Date.now();

    camera.x -= 3 * Math.sin(camera.angle) * (current-time)*0.03;
    camera.y -= 3 * Math.cos(camera.angle) * (current-time)*0.03;

    var mapoffset = ((Math.floor(camera.y) & 1023) << 10) + (Math.floor(camera.x) & 1023)|0;
    camera.height = heightmap[mapoffset]  + 64;

/*
//input.leftright -1 .. 1
//camera.horizon -500 .. 500
//input.updown init: -10 .. 10
*/

/*    input.keypressed = false;
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
    }*/

    // Collision detection. Don't fly below the surface.
    //var mapoffset = ((Math.floor(camera.y) & 1023) << 10) + (Math.floor(camera.x) & 1023)|0;
    //if ((heightmap[mapoffset]+10) > camera.height) camera.height = heightmap[mapoffset] + 10;

    time = current;
}


// ---------------------------------------------
// The main render routine

function Render() {
    var sinang = Math.sin(camera.angle);
    var cosang = Math.cos(camera.angle);
    var hiddeny = new Uint32Array(a.width);

    for (var i=0; i<a.width; i++)
        hiddeny[i] = a.height;

    // Draw from front to back
    for (var z=1; z<camera.distance; z++)
    {
        // 90 degree field of view
        var plx =  -cosang * z - sinang * z;
        var ply =   sinang * z - cosang * z;
        var prx =   cosang * z - sinang * z;
        var pry =  -sinang * z - cosang * z;

        var dx = (prx - plx) / a.width;
        var dy = (pry - ply) / a.width;
        plx += camera.x;
        ply += camera.y;
        var invz = 1 / z * 240;
        for (var i=0; i<a.width; i++) {
            // |0 is math floor
            var mapoffset = ( ((ply|0) & 1023) << 10) + ( (plx|0) & 1023);
            var heightonscreen = (camera.height - heightmap[mapoffset]) * invz + camera.horizon|0;

            //DrawVerticalLine(i, heightonscreen, hiddeny[i], colormap[mapoffset]);
            // Fast way to draw vertical lines
            if (heightonscreen < 0) heightonscreen = 0;
            if (heightonscreen <= hiddeny[i]) {
              // get offset on screen for the vertical line
              var offset = ((heightonscreen * a.width) + i);
              for (var k = heightonscreen; k < hiddeny[i]; k++) {
                  buf32[offset] = colormap[mapoffset];
                  offset += a.width;
              }
            }
            //DrawVerticalLine end

            if (heightonscreen < hiddeny[i]) hiddeny[i] = heightonscreen;
            plx += dx;
            ply += dy;
        }
    }
}


// ---------------------------------------------
// Draw the next frame

function Draw(){
    UpdateCamera();

    // DrawBackground
    //var color = 0xFFFFD68A;
    //for (var i = 0; i < buf32.length; i++) buf32[i] = color;
    buf32.fill(pallete[0]);

    Render();

    // Flip, Show the back buffer on screen
    imagedata.data.set(buf8);
    context.putImageData(imagedata, 0, 0);

window.requestAnimationFrame(Draw);
//window.setTimeout(Draw, 0);
/*    if (!input.keypressed) {
      updaterunning = false;
    } else {
      window.setTimeout(Draw, 0);
    }*/
}

// ---------------------------------------------
// Init routines


// GENERATE HEIGHTMAP START
function fract(n) {
  return n - Math.floor(n);
}
function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

function hash2d(x, y) {
  x = 50 * fract(x * 0.3183099 + 0.71);
  y = 50 * fract(y * 0.3183099 + 0.113);
  // SEED is 7
  return -1 + 2 * fract(1.375986 * 7 + x * y * (x + y));
}
function noise2d(x, y) {
  let ix = Math.floor(x);
  let iy = Math.floor(y);
  let fx = fract(x);
  let fy = fract(y);
  let ux = fx * fx * (3 - 2 * fx);
  return lerp(
    lerp(hash2d(ix, iy), hash2d(ix + 1, iy), ux),
    lerp(hash2d(ix, iy + 1), hash2d(ix + 1, iy + 1), ux),
    fy * fy * (3 - 2 * fy)
  );
}

function fractal2d (x, y, octaves) {
  var val = 0;
  for (let i = 0; i < octaves; i++) {
    val += noise2d(x, y) / Math.pow(2, 0.5 + i - 0.5 * i);
    x -= i * 19;
    y += i * 7;
    x *= 1.4;
    y *= 1.4;
  }
  return val;
}

ofs=0;
var hm=[];
for (x=0;x<1024;x++) {
  for (y=0;y<1024;y++) {
//      var l = ((0.3 + fractal2d(x / 255, y / 255, 9) * 0.5) * 254)|0;
    var l = ((0.5 + fractal2d(x / 512, y / 512, 17) * 0.5) * 254)|0;

    if (l<0) l=0;
    hm[ofs++] = l
    //if (l == undefined || l<0 || l > 255) console.log('err:',l);
  }
}
// GENERATE HEIGHTMAP END



// GENERATE COLORMAP START
function calcSmoothColor(col1, col2, pos) {
	var b= col1&255;
	var g=(col1>>8)&255;
	var r=(col1>>16)&255;
	var b2= col2&255;
	var g2=(col2>>8)&255;
	var r2=(col2>>16)&255;

	var mul=pos*pallete.length;
	var oppositeColor = 255-mul;

	r=(r*mul + r2*oppositeColor) >> 8;
	g=(g*mul + g2*oppositeColor) >> 8;
	b=(b*mul + b2*oppositeColor) >> 8;

	return 0xff000000 | (r << 16) | (g << 8) | (b);
}

var boarderCount = 255 / pallete.length;
var col = [];
for (var i=0; i<256; i++) {
	var ofs=0;
	var pos = i;
	while (pos > boarderCount) {
		pos -= boarderCount;
		ofs++;
	}

	var targetOfs = ofs+1;
	col[i] = calcSmoothColor(pallete[targetOfs%pallete.length], pallete[ofs%pallete.length], pos);
}
// GENERATE COLORMAP END


//function Init() {
    heightmap = new Uint8Array(1024*1024);
    colormap = new Uint32Array(1024*1024); // 1024*1024 int array with RGB colors

    // LOAD MAP
    //DownloadImagesAsync(["https://raw.githubusercontent.com/s-macke/VoxelSpace/master/maps/C1W.png", "https://raw.githubusercontent.com/s-macke/VoxelSpace/master/maps/D1.png"], OnLoadedImages);
    for (var i=0; i<1024*1024; i++) {
        var r = hm[i];
        colormap[i] = col[r];//0xFF000000 | (r << 16) | (r << 8) | r;
        heightmap[i] = r;//Math.random()*256 | 0;
    }

    var aspect = window.innerWidth / window.innerHeight;
    a.width = window.innerWidth<800?window.innerWidth:800;
    a.height = a.width / aspect;

    context = a.getContext('2d');
    imagedata = context.createImageData(a.width, a.height);
    var bufarray = new ArrayBuffer(imagedata.width * imagedata.height * 4);
    buf8   = new Uint8Array(bufarray);
    buf32  = new Uint32Array(bufarray);

    Draw();

    // set event handlers for keyboard, mouse, touchscreen and window resize
    /*document.onmousedown = (e) => {
      input.forwardbackward = 3;
      input.mouseposition = [e.pageX, e.pageY];
      time = Date.now();
      if (!updaterunning) Draw();
    };

    document.onmouseup = () => {
      input.mouseposition = null;
      input.forwardbackward = 0;
      input.leftright = 0;
      input.updown = 0;
    }

    document.onmousemove  = (e) => {
      //if (input.mouseposition == null || input.forwardbackward == 0) return;
      input.leftright = (input.mouseposition[0]-e.pageX)*1e-3;
      camera.horizon  = 100 + (input.mouseposition[1]-e.pageY)*0.5;
      input.updown    = (input.mouseposition[1]-e.pageY)*1e-2;

      console.log('input.updown',input.updown);
    }*/
})();
