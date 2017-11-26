
function pink1d() {
  var noiseData = new Float32Array(1024*1024);
  var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (var i = 0, imax = noiseData.length; i < imax; i++) {
    var white = Math.random() * 2 - 1;

    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;

    noiseData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    noiseData[i] *= 256 * 0.11;
    noiseData[i] |= 0;
    b6 = white * 0.115926;
  }
  return noiseData;
}


function getSimple() {
  var res = [];
  for (x=1;x<1024*1024;x++) res[x] = (Math.random() * 256)|0;

  ofs=0;
  for (x=1;x<1024;x++) {
    for (y=1;y<1024;y++) {
      var n00 = res[ofs] | 0;
      var n01 = res[ofs - 1024] | 0;
      var n10 = res[ofs - 1] | 0;
      var n11 = res[ofs - 1025] | 0;
      res[ofs++] = (n00+n01+n10+n11)>>2;
    }
  }
  return res;
}

function ter() {
  	var seed = 7;

    function fract(n) {
      return n - Math.floor(n);
  	}
  	function lerp(a, b, t) {
  		return (1 - t) * a + t * b;
  	}

    function hash2d(x, y) {
			x = 50 * fract(x * 0.3183099 + 0.71);
			y = 50 * fract(y * 0.3183099 + 0.113);
			return -1 + 2 * fract(1.375986 * seed + x * y * (x + y));
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
    var res=[];
    for (x=0;x<1024;x++) {
      for (y=0;y<1024;y++) {
        var l = ((0.3 + fractal2d(x / 255, y / 255, 7) * 0.5) * 254)|0;
        if (l<0) l=0;
        res[ofs++] = l
        if (l == undefined || l<0 || l > 255) console.log('err:',l);
      }
    }
/*    for (x=0;x<512;x++) {
      for (y=0;y<512;y++) {
//        var m = (0.5 + fractal2d(x / 128, y / 128, 7) * 0.5) * 255;

        res[x + 1024 * y] = m;
        res[(1023-x) + 1024 * y] = m;
        res[x + 1024 * (1023-y)] = m;
        res[(1023-x) + 1024 * (1023-y)] = m;
      }
    }*/
    return res;
}

var xx = ter(10);

var imgdata = c.getImageData(0,0, 1024, 1024);
var imgdatalen = imgdata.data.length;
var ofs = 0;
for(var i=0;i<imgdatalen/4;i++){  //iterate over every pixel in the canvas
  var o = xx[ofs++];
  imgdata.data[4*i] = o;    // RED (0-255)
  imgdata.data[4*i+1] = o;    // GREEN (0-255)
  imgdata.data[4*i+2] = o;    // BLUE (0-255)
  imgdata.data[4*i+3] = 255;  // APLHA (0-255)
}
c.putImageData(imgdata,0,0);
