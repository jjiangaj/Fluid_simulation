
//---------Basic data
var gl;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
var vBuffer;
var vBuffer_pad;
var vPosition;
var vPosition_pad;
var raining = false;
var iBuffer;
var cBuffer;
var program;
var program_pad;
var vertices = [];
var height_map = [];
var normals = [];
var indices = [];
var sliderX;
var outputX;
var sliderY;
var outputY;
var sliderZ;
var isDrawing;
var damping = 16;
var intensity = 0.5;
var vertices_pad = [ vec4(0, -1, -1, 1),
                 vec4(0, 1, -1, 1),
                 vec4( 1, 1, -1, 1),
                 vec4( 1, -1, -1, 1),
                 vec4(0, -1, -1, 1),
                 vec4( 1, 1, -1, 1)];

//---------Help function
function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function unbind(){
  gl.bindBuffer( gl.ARRAY_BUFFER, null);
  gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null);
}

function getRelativeMousePosition(event, target) {
  target = target || event.target;
  var rect = target.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

// assumes target or event.target is canvas
function getNoPaddingNoBorderCanvasRelativeMousePosition(event, target) {
  target = target || event.target;
  var pos = getRelativeMousePosition(event, target);

  pos.x = pos.x * target.width  / target.clientWidth;
  pos.y = pos.y * target.height / target.clientHeight;

  return pos;  
}
//-------------------------

var quads = 110;
for (var y = 0; y <= quads; y++) {
  var v = y / quads;
  for (var x = 0; x <= quads; x++) {
    var u = x / quads;
    if(x == 50 && y == 55)
       vertices.push( vec4(u*0.6-0.8, v*1.2-0.6, 1, 0));
    else
    vertices.push( vec4(u*0.6-0.8, v*1.2-0.6, 0, 0));
    normals.push( vec3(0, 0, 1));
  }
}

var rowSize = (quads + 1);
for (var y = 0; y < quads; ++y) {
  var rowOffset0 = (y + 0) * rowSize;
  var rowOffset1 = (y + 1) * rowSize;
  for (var x = 0; x < quads; ++x) {
    var offset0 = rowOffset0 + x;
    var offset1 = rowOffset1 + x;
    indices.push(offset0, offset0 + 1, offset1);
    indices.push(offset1, offset0 + 1, offset1 + 1);
  }
}
//-------------------------------

//Buffer1: [2]
//Buffer2: [3]
function updateHeight(){
  for (var y = 1; y < rowSize-1; ++y) {
    for (var x = 1; x < rowSize-1; ++x) {
      var newHeight = (
        //north
        vertices[ (y+1)*rowSize + x ][3]+
        //south
        vertices[ (y-1)*rowSize + x ][3]+
        //east
        vertices[ (y)*rowSize + x + 1][3]+
        //west
        vertices[ (y)*rowSize + x - 1][3]
      )/2 - vertices[ y*rowSize + x][2];
      newHeight = newHeight - newHeight/damping;
      vertices[ y*rowSize + x][2] = newHeight;
  }
}
}

function swap(){
    for (var y = 1; y < rowSize-1; ++y) {
    for (var x = 1; x < rowSize-1; ++x) {
    var temp = vertices[ y*rowSize-1 + x][2];
    vertices[ y*rowSize-1 + x][2] = vertices[ y*rowSize-1 + x][3];
    vertices[ y*rowSize-1 + x][3] = temp;
    }
  }
}

//-------------------------------

window.onload = function init()
{
   window.addEventListener('contextmenu', e => {
     e.preventDefault();
   });

    var canvas = document.getElementById( "gl-canvas" );
    var button_more = document.getElementById("moreDamping");
    var button_less = document.getElementById("lessDamping");
    var dampingText = document.getElementById("visValue");
    var ins_more = document.getElementById("moreIntensity");
    var ins_less = document.getElementById("lessIntensity");
    var insText = document.getElementById("inpuptIns");
    dampingText.innerHTML = 32 - damping;
    insText.innerHTML = intensity;

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.enable(gl.DEPTH_TEST);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.2, 0.2, 0.2, 1.0 );

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    program_pad = initShaders( gl, "pad_vertex-shader", "pad_fragment-shader");
    gl.useProgram( program );

    // Load the mesh plane
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    iBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    unbind();

    //--------------------------------------
    gl.useProgram( program_pad );
    vBuffer_pad = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_pad );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices_pad), gl.STATIC_DRAW);

    vPosition_pad = gl.getAttribLocation( program_pad, "vPosition_pad");
    gl.enableVertexAttribArray( vPosition_pad );
    gl.vertexAttribPointer( vPosition_pad, 4, gl.FLOAT, false, 0, 0 );

    unbind();


    //---------Height map texture
    // Create a texture.
    var image = document.getElementById("texImage");
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    gl.uniform1i(program_pad.u_Sampler, 0);

    sliderX = document.getElementById("xRange");
    outputX = document.getElementById("displayX");
    outputX.innerHTML = sliderX.value; // Display the default slider value
    // Update the current slider value (each time you drag the slider handle)
    sliderY = document.getElementById("yRange");
    outputY = document.getElementById("displayY");
    outputY.innerHTML = sliderY.value; // Display the default slider value
    // Update the current slider value (each time you drag the slider handle)
    sliderZ = document.getElementById("zRange");
    outputZ = document.getElementById("displayZ");
    outputZ.innerHTML = sliderZ.value; // Display the default slider value
    // Update the current slider value (each time you drag the slider handle)

    sliderX.oninput = function() {
        outputX.innerHTML = this.value;
        render();
    } 
    sliderY.oninput = function() {
        outputY.innerHTML = this.value;
        render();
    } 
    sliderZ.oninput = function() {
        outputZ.innerHTML = this.value;
        render();
    } 

    canvas.addEventListener("click", function(event){
        var mouse_x = 2*event.clientX/canvas.width - 1;
        var mouse_y = (canvas.height-event.clientY)/canvas.height;

        if(mouse_x >= 0)
          {
            mouse_x = Math.floor(mouse_x * rowSize) -1;
            mouse_y = Math.floor(mouse_y * rowSize);
        }

        vertices[mouse_y *rowSize+ mouse_x ][2] = intensity;
        vertices[mouse_y *rowSize + mouse_x + 1][2] = intensity;
        vertices[mouse_y *rowSize+ mouse_x - 1][2] = intensity;
        vertices[mouse_y *rowSize+ mouse_x + rowSize][2] = intensity;
        vertices[mouse_y *rowSize+ mouse_x - rowSize][2] = intensity;
      
    });

    canvas.addEventListener("dblclick", function(){
        raining = !raining;
    });

    canvas.addEventListener("mousedown", function(event){
      isDrawing = true;
    });

    canvas.addEventListener('mousemove', function(event) {
      if (isDrawing === true) {
        var mouse_x = 2*event.clientX/canvas.width - 1;
        var mouse_y = (canvas.height-event.clientY)/canvas.height;

       if(mouse_x >= 0)
        {
          mouse_x = Math.floor(mouse_x * rowSize) -1;
          mouse_y = Math.floor(mouse_y * rowSize);
         }

         vertices[mouse_y *rowSize+ mouse_x ][2] = intensity;
         vertices[mouse_y *rowSize + mouse_x + 1][2] = intensity;
         vertices[mouse_y *rowSize+ mouse_x - 1][2] = intensity;
         vertices[mouse_y *rowSize+ mouse_x + rowSize][2] = intensity;
         vertices[mouse_y *rowSize+ mouse_x - rowSize][2] = intensity;
      }
    });
    
    canvas.addEventListener('mouseup', function(event) {
        isDrawing = false;
    });


    button_more.addEventListener('click',function(){
      damping = damping-2;
      if(damping < 2) damping = 2;
      dampingText.innerHTML = 32 - damping;
    });

    button_less.addEventListener('click',function(){
      damping = damping+2;
      if(damping > 32) damping = 32;
      dampingText.innerHTML = 32 - damping;
 
    });

    ins_more.addEventListener('click',function(){
      intensity = Math.round( (intensity + 0.1) * 10 ) / 10;
      if(intensity > 1) intensity = 1;
      insText.innerHTML = intensity;
    });

    ins_less.addEventListener('click',function(){
      intensity = Math.round( (intensity - 0.1) * 10 ) / 10;
      if(intensity < 0) intensity = 0;
      insText.innerHTML = intensity;
    });

    thetaLoc = gl.getUniformLocation(program, "theta");

    startAnimating(30);
};

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

var stop = false;
var frameCount = 0;
var fps, fpsInterval, startTime, now, then, elapsed;


// initialize the timer variables and start the animation

function startAnimating(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
}


function animate() {

  // request another frame

  requestAnimationFrame(animate);

  // calc elapsed time since last loop

  now = Date.now();
  elapsed = now - then;

  // if enough time has elapsed, draw the next frame

  if (elapsed > fpsInterval) {

      // Get ready for next frame by setting then=now, but also adjust for your
      // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
      then = now - (elapsed % fpsInterval);

      // Put your drawing code here
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
     var aX = radians(sliderX.value);
     var aY = radians(sliderY.value);
      var aZ = radians(sliderZ.value);
     var t = vec3(aX, aY, aZ);
    
    updateHeight();
    if(raining == true)
    {
      var mouse_x = Math.random() * 0.8 + 0.1;
      var mouse_y = Math.random() * 0.8 + 0.1;

      mouse_x = Math.floor(mouse_x * rowSize) -1;
      mouse_y = Math.floor(mouse_y * rowSize);

      vertices[mouse_y *rowSize+ mouse_x ][2] = intensity;
      vertices[mouse_y *rowSize + mouse_x + 1][2] = intensity;
      vertices[mouse_y *rowSize+ mouse_x - 1][2] = intensity;
      vertices[mouse_y *rowSize+ mouse_x + rowSize][2] = intensity;
      vertices[mouse_y *rowSize+ mouse_x - rowSize][2] = intensity;
    }

    gl.useProgram( program);
    gl.uniform3fv( thetaLoc, t);
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer );
    gl.enableVertexAttribArray(vPosition);     
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);
    unbind();

    gl.useProgram(program_pad);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_pad);
    vPosition_pad = gl.getAttribLocation( program_pad, "vPosition_pad");
    gl.enableVertexAttribArray( vPosition_pad );
    gl.vertexAttribPointer( vPosition_pad, 4, gl.FLOAT, false, 0, 0 );
    gl.drawArrays(gl.TRIANGLES, 0, vertices_pad.length);
    unbind();
    swap();
  }
}


function render(){

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    var aX = radians(sliderX.value);
    var aY = radians(sliderY.value);
    var aZ = radians(sliderZ.value);
    var t = vec3(aX, aY, aZ);
    
    updateHeight();

    gl.useProgram( program);
    gl.uniform3fv( thetaLoc, t);
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer );
    gl.enableVertexAttribArray(vPosition);     
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);
    unbind();

    gl.useProgram(program_pad);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_pad);
    vPosition_pad = gl.getAttribLocation( program_pad, "vPosition_pad");
    gl.enableVertexAttribArray( vPosition_pad );
    gl.vertexAttribPointer( vPosition_pad, 4, gl.FLOAT, false, 0, 0 );
    gl.drawArrays(gl.TRIANGLES, 0, vertices_pad.length);
    unbind();

    startAnimating(30);
    swap();
}


