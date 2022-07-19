export default `
uniform vec2 resolution;
uniform float time;
uniform mat4 cameraTransform;
uniform vec3 lightPosition;
uniform sampler2D heightmap;
uniform sampler2D noise;

#define MIN_DIST 1.
#define SC 250.
#define FAR_DIST 15.0*SC
#define NUM_STEPS 300
#define SHADOW_STEPS 64
#define PI 3.14159

#define SHADOW_SOFTNESS 40.0

// Helper functions from https://github.com/nicoptere/raymarching-for-THREE/blob/master/glsl/fragment.glsl

vec2 unionAB(vec2 a, vec2 b){ if(a.x < b.x) return a; else return b;}
vec2 intersectionAB(vec2 a, vec2 b){return vec2(max(a.x, b.x),1.);}
vec2 blendAB( vec2 a, vec2 b, float t ){ return vec2(mix(a.x, b.x, t ),mix(a.y, b.y, t ));}
vec2 subtractAB(vec2 a, vec2 b){ return vec2(max(-a.x, b.x), a.y); }
//http://iquilezles.org/www/articles/smin/smin.htm
vec2 smin( vec2 a, vec2 b, float k ) { float h = clamp( 0.5+0.5*(b.x-a.x)/k, 0.0, 1.0 ); return vec2( mix( b.x, a.x, h ) - k*h*(1.0-h), mix( b.y, a.y, h ) ); }
 
mat3 rotationMatrix3(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c          );
}

mat2 m2 = mat2(0.8,-0.6,0.6,0.8);
float fbm( vec2 p )
{
    float f = 0.0;
    f += 0.5000*texture( noise, p/256.0 ).x; p = m2*p*2.02;
    f += 0.2500*texture( noise, p/256.0 ).x; p = m2*p*2.03;
    f += 0.1250*texture( noise, p/256.0 ).x; p = m2*p*2.01;
    f += 0.0625*texture( noise, p/256.0 ).x;
    return f/0.9375;
}

float terrain(vec2 p) {
    // vec2 pos = p;
    float lod = 1.;
    vec2 heightmapDimensions = vec2(textureSize(heightmap, int(3)));

    // do bilinear interpolation on texture

    float value = textureLod( heightmap, (p + heightmapDimensions / 2.) / 256., lod ).x;
    float res = 0.;
    // vec2 pos = vec2(0.);
    // float buffer = 0.;
    // for (int x = -1; x <= 1; ++x)
    // {
    //     for (int y = -1; y <= 1; ++y) {
    //         // if (x == 0 && y == 0) continue;
            
    //         vec2 pos = p + 0.25*vec2(x,y);
    //         buffer += textureLod( heightmap, (pos + heightmapDimensions / 2.) / 256., lod).x / 9.;
    //     }
    // }
    res = value;
    // pos.x += 1.;
    // float x_1 = textureLod( heightmap, (pos + heightmapDimensions / 2.) / 256., lod ).x;

    // pos.x -= 1.;
    // float x_2 = textureLod( heightmap, (pos + heightmapDimensions / 2.) / 256., lod ).x;
    
    // pos.x += 2.;
    // pos.y -= 1.;
    // float y_1 = textureLod( heightmap, (pos + heightmapDimensions / 2.) / 256., lod ).x;
    
    // pos.y += 2.;
    // float y_2 = textureLod( heightmap, (pos + heightmapDimensions / 2.) / 256., lod ).x;

    // pos.y -= 1.;
    // float value = textureLod( heightmap, (p + heightmapDimensions / 2.) / 256., lod ).x;

    // value += (( x_2 - x_1) + ( y_2 - y_1)) / 4.0;
    return res * 80.;
}

vec3 calcNormal( in vec3 pos, float t )
{
    vec2  eps = vec2( 0.001*t, 0.0 );
    return normalize( vec3( terrain(pos.xz-eps.xy) - terrain(pos.xz+eps.xy),
                            2.0*eps.x,
                            terrain(pos.xz-eps.yx) - terrain(pos.xz+eps.yx) ) );
}

vec3 calcNormalFBM( in vec3 pos, float t )
{
    vec2  eps = vec2( 0.001*t, 0.0 );
    return normalize( vec3( fbm(pos.xz-eps.xy) - fbm(pos.xz+eps.xy),
                            2.0*eps.x,
                            fbm(pos.xz-eps.yx) - fbm(pos.xz+eps.yx) ) );
}

vec3 getCamPosition() {
    return vec3(cameraTransform[3][0], cameraTransform[3][1], cameraTransform[3][2]);
}

mat3 getCamRotationMat() {
    mat3 rot = mat3(0.);
    for (int x = 0; x < 3; ++x) {
        for (int y = 0; y < 3; ++y) {
            rot[x][y] = cameraTransform[x][y];
        }
    }
    return rot;
}

float raycast(vec3 p, vec3 dir, float tmin, float tmax) {
    float t = tmin;
    vec3 pos = p;
    for (int i = 0; i < NUM_STEPS; ++i) {
        pos = p + dir * t;
        float h = pos.y - terrain(pos.xz);
        if (abs(h) < (0.0015*t) || t > tmax) break;
        t += 0.3*h;
    }
    return t;
}

void main( void ) {
 
    // get screen uv's
	vec2 uv = ( gl_FragCoord.xy / resolution.xy ) * 2.0 - 1.0;
	uv.x *= resolution.x / resolution.y;
 

    // set camera position and direction

	vec3 ro = getCamPosition();
    mat3 cameraRot = getCamRotationMat();
	vec3 rd = cameraRot * normalize( vec3( uv, -1. ) );

    float maxh = 250.0*SC;
    float tp = (maxh-ro.y)/rd.y;
    float tmin = MIN_DIST;
    float tmax = FAR_DIST;
    if( tp>0.0 )
    {
        if( ro.y>maxh ) tmin = max( tmin, tp );
        else            tmax = min( tmax, tp );
    }

    float t = raycast(ro, rd, tmin, tmax);
    vec3 col = vec3(0.);
    if( t > FAR_DIST )
    {
        // sky		
        col = vec3(0.3,0.5,0.85) - rd.y*rd.y*0.5;
        col = mix( col, 0.85*vec3(0.7,0.75,0.85), pow( 1.0-max(rd.y,0.0), 4.0 ) );
        // sun
		// col += 0.25*vec3(1.0,0.7,0.4)*pow( sundot,5.0 );
		// col += 0.25*vec3(1.0,0.8,0.6)*pow( sundot,64.0 );
		// col += 0.2*vec3(1.0,0.8,0.6)*pow( sundot,512.0 );
        // clouds
		vec2 sc = ro.xz + rd.xz*(SC*1000.0-ro.y)/rd.y;
		col = mix( col, vec3(1.0,0.95,1.0), 0.5*smoothstep(0.5,0.8,fbm(0.0005*sc/SC)) );
        // horizon
        col = mix( col, 0.68*vec3(0.4,0.65,1.0), pow( 1.0-max(rd.y,0.0), 16.0 ) );
        t = -1.0;
	} 
    else
    {
        vec3 pos = ro + t*rd;
        // vec3(cos(pos.z), sin(pos.z), .5);//
        col = calcNormal(pos, t);
    }

    // calc normals
    // vec3 normal = calcNormal(final);

    // Assign material
    // vec3 rgb = getMaterial(val, normal, final);

    // rgb *= getLight(final);
    // rgb *= getShadows(final);

    // Fix bugs and do background
    // if (val.x > FAR_DIST)
    // {
    //     vec3 col = vec3(dir.y*0.8+0.5, dir.y*0.8+0.5, 1.);
    //     rgb = col;
    // }
	gl_FragColor = vec4(col, 1.);
}
`;