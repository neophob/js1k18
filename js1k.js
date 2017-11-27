// based on https://github.com/s-macke/VoxelSpace

(() => {

// ---------------------------------------------
// Viewer information
/*var camera =
{
    x:        512, // x position on the map
    y:        800, // y position on the map
    height:    78, // height of the camera
    angle:      40, // direction of the camera
    horizon:  100, // horizon position (look up and down)
    distance: 2000   // distance of map
};*/
var cameraX = 512;
var cameraY = 800;
var cameraHeight = 78;
var cameraAngle = 40;
var cameraHorizon = 100;

// ---------------------------------------------
// Landscape data

var heightmap, colormap; // 1024*1024 byte array with height information
// ---------------------------------------------
// Screen data

var buf8, buf32, imagedata, context, time=0;

//var pallete = [0xff000000, 0xff000099,  0xff000000];// 0xff0000ff, 0xffFFD38C];
var pallete = [0x000ff0, 0x113231, 0x2d616e, 0xFFD38C];



// ---------------------------------------------
// Draw the next frame

var Draw = () => {

// ## UPDATE CAMERA START
    var current = Date.now();

    cameraX -= 3 * Math.sin(cameraAngle) * (current-time)*0.03;
    cameraY -= 3 * Math.cos(cameraAngle) * (current-time)*0.03;

    var mapoffset = ((Math.floor(cameraY) & 1023) << 10) + (Math.floor(cameraX) & 1023);
//    cameraHeight = heightmap[mapoffset] + 64;
    cameraHeight = 200 + heightmap[mapoffset]/3

/*
//input.leftright -1 .. 1
//cameraHorizon -500 .. 500
//input.updown init: -10 .. 10
*/

/*    input.keypressed = false;
    if (input.leftright != 0)
    {
        cameraAngle += input.leftright*0.1*(current-time)*0.03;
        input.keypressed = true;
    }
    if (input.forwardbackward != 0)
    {
        cameraX -= input.forwardbackward * Math.sin(cameraAngle) * (current-time)*0.03;
        cameraY -= input.forwardbackward * Math.cos(cameraAngle) * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.updown != 0)
    {
        cameraHeight += input.updown * (current-time)*0.03;
        input.keypressed = true;
    }*/

    // Collision detection. Don't fly below the surface.
    //var mapoffset = ((Math.floor(cameraY) & 1023) << 10) + (Math.floor(cameraX) & 1023)|0;
    //if ((heightmap[mapoffset]+10) > cameraHeight) cameraHeight = heightmap[mapoffset] + 10;

    time = current;
// UPDATE CAMERA START

// ## DRAW BACKGROUND START
    //var color = 0xFFFFD68A;
    //for (var i = 0; i < buf32.length; i++) buf32[i] = color;
    buf32.fill(0xff000000|pallete[0]);
// DRAW BACKGROUND END


// ## RENDER START

    var sinang = Math.sin(cameraAngle);
    var cosang = Math.cos(cameraAngle);

    var hiddeny = new Uint32Array(a.width);
    hiddeny.fill(a.width);

    // Draw from front to back, 2000 is CAMERA DISTANCE
    for (var z=1; z<2000; z++) {

        if (z > 300) z++;
        if (z > 600) z++;
        if (z > 800) z+=4;
        // 90 degree field of view
        var prx =   cosang * z - sinang * z;
        var plx =  -prx;
        var ply =   sinang * z - cosang * z;
        var pry =  -sinang * z - cosang * z;

        var dx = (prx - plx) / a.width;
        var dy = (pry - ply) / a.width;
        plx += cameraX;
        ply += cameraY;

        // DEFINE HEIGHT (140)
        var invz = 1 / z * 140;
        for (var i=0; i<a.width; i++) {
          // |0 is math floor
          var mapoffset = ( ((ply|0) & 1023) << 10) + ( (plx|0) & 1023);
          var heightonscreen = (cameraHeight - heightmap[mapoffset]) * invz + cameraHorizon|0;

          //DrawVerticalLine(i, heightonscreen, hiddeny[i], colormap[mapoffset]);
          // Fast way to draw vertical lines
          if (heightonscreen < 0) heightonscreen = 0;
          if (heightonscreen <= hiddeny[i]) {
            // get offset on screen for the vertical line
            var offset = ((heightonscreen * a.width) + i);
            for (var k = heightonscreen; k < hiddeny[i]; k++) {
                //TODO add offset to mapoffset
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

  // ## RENDER END


    // Flip, Show the back buffer on screen
    imagedata.data.set(buf8);
    context.putImageData(imagedata, 0, 0);

    window.requestAnimationFrame(Draw);
}


// # INIT

// GENERATE HEIGHTMAP START
var map = new Float32Array(1025 * 1025);
map.fill(0);

var tget = (x,y) => {
  // wrap around to make map tileable
  return map[(x & 1023) + (y & 1023) * 1025];
};
var tset = (x,y,val) => {
  if (val<0){val=0}
  if (val>1024){val=1024}
  map[x + 1025 * y] = val;
};
var divide = (size) => {
  if (size < 2) return;
  var half = size / 2;
  //roughness
  var scale = 2.4 * size;

  for (var y = half; y < 1024; y += size) {
    for (var x = half; x < 1024; x += size) {
      //SQUARE
      tset(x, y, (
        tget(x - half, y - half) +   // upper left
        tget(x + half, y - half) +   // upper right
        tget(x + half, y + half) +   // lower right
        tget(x - half, y + half)    // lower left
      ) / 4 + Math.random() * scale * 2 - scale);
    }
  }
  for (var y = 0; y <= 1024; y += half) {
    for (var x = (y + half) % size; x <= 1024; x += size) {
      //DIAMOND
      tset(x, y, (
        tget(x, y - half) +     // top
        tget(x + half, y) +      // right
        tget(x, y + half) +     // bottom
        tget(x - half, y)       // left
      ) / 4 + Math.random() * scale * 2 - scale);
    }
  }
  divide(size / 2);
}
map[0] = map[1024] = 1024;
divide(1024);
var hm = [];
var tmp = 0;
for(var i=0;i<map.length;i++){  //iterate over every pixel in the canvas
  hm[tmp++] = Math.floor(255 * (map[i]/1024));
  if (!(i%1024)) i+=1;
}
// GENERATE HEIGHTMAP END


// GENERATE COLORMAP START
var calcSmoothColor = (col1, col2, pos) => {
	var b= col1&255;
	var g=(col1>>8)&255;
	var r=(col1>>16)&255;
	var b2= col2&255;
	var g2=(col2>>8)&255;
	var r2=(col2>>16)&255;

	var mul=pos*pallete.length;
	var oppositeColor = 255-mul;

	r=(r*mul + r2*oppositeColor) / 255;
	g=(g*mul + g2*oppositeColor) / 255;
	b=(b*mul + b2*oppositeColor) / 255;

	return 0xff000000 | (r << 16) | (g << 8) | (b);
}

tmp = 255 / pallete.length;
var col = [];
for (var i=0; i<256; i++) {
	var ofs=0;
	var pos = i;
	while (pos > tmp) {
		pos -= tmp;
		ofs++;
	}

	var targetOfs = ofs+1;
	col[i] = calcSmoothColor(pallete[targetOfs%pallete.length], pallete[ofs%pallete.length], pos);
}
// GENERATE COLORMAP END

//uint8 would be enough, however uint32 is shorter
//0xff000000 = 1024x1024
heightmap = new Uint32Array(1024*1024);
colormap = new Uint32Array(1024*1024);

// LOAD MAP
hm.forEach((r,i)=>{
  colormap[i] = col[r];
  heightmap[i] = r;
});

context = a.getContext('2d');
imagedata = context.createImageData(a.width, a.height);
tmp = new ArrayBuffer(a.width * a.height * 4);
buf8   = new Uint8Array(tmp);
buf32  = new Uint32Array(tmp);

Draw();

})();
