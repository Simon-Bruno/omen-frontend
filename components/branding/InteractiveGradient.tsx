import { useEffect, useRef } from 'react';

const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_time;

  // Simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // Calculate aspect-corrected UV coordinates
    float minWidth = 900.0;
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    
    // Apply width-based scaling
    if (u_resolution.x < minWidth) {
      float scale = u_resolution.x / minWidth;
      st.x = (st.x - 0.5) / scale + 0.5;
    }
    
    vec2 mouse = u_mouse/u_resolution.xy;
    if (u_resolution.x < minWidth) {
      float scale = u_resolution.x / minWidth;
      mouse.x = (mouse.x - 0.5) / scale + 0.5;
    }
    
    // Base colors from the original design
    vec3 color1 = vec3(0.861, 0.665, 0.214); // Softer yellow
    vec3 color2 = vec3(0.922, 0.376, 0.263); // #EB6043
    vec3 color3 = vec3(0.188, 0.569, 0.914); // #3091E9
    vec3 color4 = vec3(0.906, 0.475, 0.384); // #E77962

    // Cursor influence with very wide, gentle falloff
    float mouseRadius = 0.6; // Larger radius
    float innerRadius = 0.2; // Much larger inner radius for gentler transition
    vec2 mouseOffset = st - mouse;
    float mouseDist = length(mouseOffset);
    float mouseInfluence = smoothstep(mouseRadius, innerRadius, mouseDist) * 0.15; // Reduced influence
    
    // Create a wider area of subtle movement
    float areaEffect = snoise(mouseOffset * 2.0 + u_time * 0.1) * 0.3;
    float centerBoost = smoothstep(innerRadius * 3.0, 0.0, mouseDist) * 0.1;
    vec2 flowOffset = normalize(mouseOffset) * (mouseInfluence + centerBoost + areaEffect * 0.01) * 0.015;
    
    // Use fixed phase for consistent wave pattern
    vec2 distortedUV = st + flowOffset;
    
    // Create dynamic noise based on position with reduced time influence
    float baseNoise = snoise(distortedUV * 3.0 + u_time * 0.1);
    float baseNoise2 = snoise(distortedUV * 5.0 - u_time * 0.15);
    
    // Apply very subtle noise enhancement
    float noiseBoost = 1.0 + (mouseInfluence + centerBoost * 0.3) * 0.1;
    float noise = baseNoise * noiseBoost;
    float noise2 = baseNoise2 * noiseBoost;
    
    // Create multiple radial gradients with stable noise
    float grad1 = length(distortedUV - vec2(0.3, -0.2) - noise * 0.015);
    float grad2 = length(distortedUV - vec2(1.1, 0.4) - noise2 * 0.015);
    float grad3 = length(distortedUV - vec2(-0.1, 1.1) - noise * 0.02);
    float grad4 = length(distortedUV - vec2(0.5, 0.5) - noise2 * 0.015);
    
    // Combine gradients with consistent noise influence
    vec3 finalColor = vec3(0.0);
    finalColor += color1 * smoothstep(0.8, 0.0, grad1 + noise * 0.08);
    finalColor += color2 * smoothstep(0.85, 0.0, grad2 + noise2 * 0.08);
    finalColor += color3 * smoothstep(1.1, 0.0, grad3 + noise * 0.1);
    finalColor += color4 * smoothstep(0.85, 0.0, grad4 + noise2 * 0.08);
    
    // Very subtle color variation
    vec3 cursorColor = mix(color2, color3, 0.5);
    finalColor += (mouseInfluence * 0.3 + centerBoost * 0.2) * cursorColor * 0.05;
    
    // Reduced grain noise
    float grainNoise = snoise(st * 250.0 + u_time * 0.5) * 0.01;
    finalColor += vec3(grainNoise);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function InteractiveGradient() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) return;

        // Create shader program
        const program = gl.createProgram();
        if (!program) return;

        // Compile shaders
        const vs = gl.createShader(gl.VERTEX_SHADER);
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        if (!vs || !fs) return;

        gl.shaderSource(vs, vertexShader);
        gl.shaderSource(fs, fragmentShader);
        gl.compileShader(vs);
        gl.compileShader(fs);
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);

        // Create geometry
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Set up attributes and uniforms
        const position = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
        const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
        const timeLocation = gl.getUniformLocation(program, 'u_time');

        // Handle resize with aspect ratio preservation
        const resize = () => {
            const pixelRatio = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Set the canvas size in pixels (accounting for pixel ratio)
            canvas.width = width * pixelRatio;
            canvas.height = height * pixelRatio;

            // Set the viewport to match the canvas size
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        };
        window.addEventListener('resize', resize);
        resize();

        // Handle mouse movement with pixel ratio correction
        const handleMouseMove = (e: MouseEvent) => {
            const pixelRatio = window.devicePixelRatio || 1;
            mouseRef.current = {
                x: e.clientX * pixelRatio,
                y: canvas.height - (e.clientY * pixelRatio) // Flip Y coordinate for WebGL
            };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        let startTime = Date.now();
        const render = () => {
            const time = (Date.now() - startTime) * 0.001;
            gl.uniform1f(timeLocation, time);
            gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            animationFrameRef.current = requestAnimationFrame(render);
        };
        render();

        // Cleanup
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            gl.deleteProgram(program);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            gl.deleteBuffer(buffer);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{
                pointerEvents: 'none',
                objectFit: 'cover' // Ensures the canvas covers the container while maintaining aspect ratio
            }}
        />
    );
} 