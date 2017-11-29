// voxel based on https://github.com/s-macke/VoxelSpace
// heightmap based on http://www.playfuljs.com/realistic-terrain-in-130-lines/

/*
  ideas:
    - add static shade to map
    - add stranger things mode - different pallete and white "snow"
    - more fancy camera path
    - blur heightmap
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
//var cameraHeight = 70;
var cameraAngle = 78;
//var cameraHorizon = 150;

// ---------------------------------------------
// Landscape data

var tmpBuffer = new ArrayBuffer(a.width * a.height * 4);
var buf8   = new Uint8Array(tmpBuffer);
var buf32  = new Uint32Array(tmpBuffer);
// was Uint32Array's - might be slower now
var heightmap = [];//new Uint32Array(1024*1024);
var colormap = [];//new Uint32Array(1024*1024);

// ---------------------------------------------
// Screen data

var time=0;
var imagedata = c.createImageData(a.width, a.height);

//var pallete = [0xff000000, 0xff000099,  0xff000000];// 0xff0000ff, 0xffFFD38C];
//var pallete = [0x000ff0, 0x113231, 0x2d616e, 0xFFD38C];
var pallete = [0, 0x2d33aa, 0xa2a7cc, 0];
//var pallete = [0, 0xff, 0x00ff00, 0xFF0000];



// ---------------------------------------------
// Draw the next frame

var Draw = () => {

// ## UPDATE CAMERA START
    var current = Date.now();

    if (current % 8 == 4)
    cameraAngle += (Math.random())*0.01*(current-time)*0.03;


    cameraX -= 3 * Math.sin(cameraAngle) * (current-time)*0.03;
    cameraY -= 3 * Math.sin(cameraAngle + 1.57) * (current-time)*0.03;
    //cameraY -= 3 * Math.cos(cameraAngle) * (current-time)*0.03;

    var cameraHeight = 255 + heightmap[
      /* get map offset*/ ((Math.floor(cameraY) & 1023) << 10) + (Math.floor(cameraX) & 1023)
    ]/3;

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
    time%16 ? buf32.fill(0xff000000) : buf32.fill(0xffa2a7cc);

//    buf32.fill(xff000ff0);
// DRAW BACKGROUND END


// ## RENDER START

    var sinang = Math.sin(cameraAngle);
    var cosang = Math.sin(cameraAngle + 1.57);
    //var cosang = Math.cos(cameraAngle);

    var hiddeny = new Uint32Array(a.width);
    hiddeny.fill(a.width);

    // Draw from front to back, 1024 is CAMERA DISTANCE
    for (var z=1; z<1500; z++) {

      //TODO inprove rendering, increase z as we go away from the front
        //if (z > 500) z+=2;
        // 90 degree field of view
        //var prx =   cosang * z - sinang * z;
        var plx =  -cosang * z - sinang * z;
        var ply =   sinang * z - cosang * z;
        //var pry =  -sinang * z - cosang * z;

        var dx = ((cosang * z - sinang * z) - plx) / a.width;
        var dy = ((-sinang * z - cosang * z) - ply) / a.width;
        plx += cameraX;
        ply += cameraY;

        // DEFINE HEIGHT (140)
        var invz = 1 / z * 240;
        for (var i=0; i<a.width; i++) {
          // |0 is math floor
          var mapoffset = ((Math.floor(ply    ) & 1023) << 10) + (Math.floor(plx) & 1023);
          var heightonscreen = Math.floor((cameraHeight - heightmap[mapoffset]) * invz + 150/*cameraHorizon|0*/);

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
    c.putImageData(imagedata,0,0);
};


// # INIT

// GENERATE HEIGHTMAP START
var tmp;
var map = [];
map[1025 * 1025] = 0;
map.fill(0);

var divide = (size) => {
  if (size < 2) return;
  var half = size / 2;
  //roughness is 2.4
  var scale = 1.7 * size;

  for (var y = half; y < 1024; y += size) {
    for (var x = half; x < 1024; x += size) {
      //SQUARE
      tmp = (
        map[((x - half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + ((y + half) & 1023) * 1025]
      ) / 4 + Math.random() * scale * 2.5 - scale;
      map[x + 1025 * y] = (tmp<0) ? 0 : (tmp>1024) ? 1024 : tmp;
    }
  }
  for (var y = 0; y <= 1024; y += half) {
    for (var x = (y + half) % size; x <= 1024; x += size) {
      //DIAMOND
      tmp = (
        map[(x & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + (y & 1023) * 1025] +
        map[(x & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + (y & 1023) * 1025]
      ) / 4 + Math.random() * scale * 2.5 - scale;
      map[x + 1025 * y] = (tmp<0) ? 0 : (tmp>1024) ? 1024 : tmp;
    }
  }
  divide(half);
}
//set initial points - not needed
//map[0] = map[1024] = 1024;
divide(1024);
var hm = [];
tmp = 0;
map.forEach((r,i)=>{
  //convert the 1025*1025 map to a 1024*1024 map
  if (i%1025!=1024) {
    hm[tmp++] = Math.floor(255 * (r/1024));
  }
});
// GENERATE HEIGHTMAP END


// LOAD MAP + GENERATE COLORMAP ON DEMAND
hm.forEach((r,i)=>{
  //generate smooth color dynamically, 4 equals the size of the pallete array
  var ofs = Math.floor(r/(255 / 4));
  var col1 = pallete[(ofs+1)%4];
  var col2 = pallete[(ofs)%4];
  var selectedPalleteEntry = 4*(r%(255 / 4));
  var oppositeColor = 255-selectedPalleteEntry;

  colormap[i] = 0xff000000 |
          (((((col1>>16)&255)*selectedPalleteEntry + ((col2>>16)&255)*oppositeColor) >>8) << 16) |
          (((((col1>>8)&255)*selectedPalleteEntry + ((col2>>8)&255)*oppositeColor) >>8) << 8) |
          (((col1&255)*selectedPalleteEntry + (col2&255)*oppositeColor) >>8);
  //cheat a bit, make brightest color visible - but cost about 8-12 bytes!
  if (r>254) colormap[i]|=0x100b0b;
  heightmap[i] = r < 70 ? 70 : r;
});
//dont use requestAnimationFrame(Draw); anymore...
setInterval(Draw, 20);
})();
