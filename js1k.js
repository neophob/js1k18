// voxel based on https://github.com/s-macke/VoxelSpace
// heightmap based on http://www.playfuljs.com/realistic-terrain-in-130-lines/

/*
  ideas:
    - add static shader to map
    - add stranger things mode - different pallete and white "snow"
    - more fancy camera path
*/

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

var heightmap = new Uint32Array(1024*1024);
var colormap = new Uint32Array(1024*1024);
var tmpBuffer = new ArrayBuffer(a.width * a.height * 4);
var buf8   = new Uint8Array(tmpBuffer);
var buf32  = new Uint32Array(tmpBuffer);

// ---------------------------------------------
// Screen data

var imagedata = c.createImageData(a.width, a.height), time=0;

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
    cameraHeight = 256 + heightmap[mapoffset]/3

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
    //select first pallete entry but add alpha values
    buf32.fill(0xff000ff0);
// DRAW BACKGROUND END


// ## RENDER START

    var sinang = Math.sin(cameraAngle);
    var cosang = Math.cos(cameraAngle);

    var hiddeny = new Uint32Array(a.width);
    hiddeny.fill(a.width);

    // Draw from front to back, 2000 is CAMERA DISTANCE
    for (var z=1; z<2000; z++) {

      //TODO inprove rendering, increase z as we go away from the front
//        if (z > 800) z+=4;
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
          var mapoffset = ((Math.floor(ply    ) & 1023) << 10) + (Math.floor(plx) & 1023);
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
    //NOTE: this is against the spec, dy and dx should be provided
    c.putImageData(imagedata,0,0);
    requestAnimationFrame(Draw);
};


// # INIT

// GENERATE HEIGHTMAP START
var map = new Uint32Array(1025 * 1025);
map.fill(0);

var tget = (x,y) => {
  // wrap around to make map tileable
  return map[(x & 1023) + (y & 1023) * 1025];
};
var tset = (x,y,val) => {
  if (val<0) val=0;
  if (val>1024) val=1024;
  map[x + 1025 * y] = val;
};
var divide = (size) => {
  if (size < 2) return;
  var half = size / 2;
  //roughness is 2.4
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
//set initial points
map[0] = map[1024] = 1024;
divide(1024);
var hm = [];
var tmp = 0;
for(var i=0;i<1024*1024;i++){  //iterate over every pixel in the canvas
  hm[tmp++] = Math.floor(255 * (map[i]/1024));
  if (!(i%1024)) i+=1;
}
// GENERATE HEIGHTMAP END


// GENERATE COLORMAP START
var calcSmoothColor = (col1, col2, pos) => {

  //4 is pallete length
  pos*=4;
	var oppositeColor = 255-pos;

	return 0xff000000 |
          (((((col1>>16)&255)*pos + ((col2>>16)&255)*oppositeColor) / 255) << 16) |
          (((((col1>>8)&255)*pos + ((col2>>8)&255)*oppositeColor) / 255) << 8) |
          (((col1&255)*pos + (col2&255)*oppositeColor) / 255);
}

//4 is pallete length
var col = [];
for (var i=0; i<256; i++) {
	var ofs=0;
	var pos = i;
	while (pos > (255 / 4)) {
		pos -= (255 / 4);
		ofs++;
	}
  //4 is pallete length
	col[i] = calcSmoothColor(pallete[(ofs+1)%4], pallete[ofs%4], pos);
}
// GENERATE COLORMAP END

//uint8 would be enough, however uint32 is shorter
//0xff000000 = 1024x1024

// LOAD MAP
hm.forEach((r,i)=>{
  colormap[i] = col[r];
  heightmap[i] = r;
});

requestAnimationFrame(Draw);
})();
