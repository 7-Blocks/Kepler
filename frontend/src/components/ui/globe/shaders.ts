// Shaders for Earth, Atmosphere, and Cloud layers ported from Earth3D

export const earthVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

    vUv = uv;
    vNormal = modelNormal;
    vPosition = modelPosition.xyz;
}
`;

export const earthFragmentShader = /* glsl */ `
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    // Sun orientation
    float sunOrientation = dot(uSunDirection, normal);

    // Day/Night color blending across the terminator line
    float dayMix = smoothstep(-0.25, 0.5, sunOrientation);
    vec3 dayColor = texture(uDayTexture, vUv).rgb;
    vec3 nightColor = texture(uNightTexture, vUv).rgb;
    color = mix(nightColor, dayColor, dayMix);

    // Specular ocean reflections
    vec2 specularCloudsColor = texture(uSpecularCloudsTexture, vUv).rg;
    float specular = specularCloudsColor.r;
    vec3 reflection = reflect(-uSunDirection, normal);
    float specularReflection = dot(reflection, -viewDirection);
    specularReflection = max(specularReflection, 0.0);
    specularReflection = pow(specularReflection, 32.0);
    specularReflection *= specular * dayMix;
    color += vec3(specularReflection * 0.6);

    // Fresnel glow at limb
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.0);

    // Atmosphere color blend
    float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    color = mix(color, atmosphereColor, fresnel * atmosphereDayMix * 0.7);

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export const cloudFragmentShader = /* glsl */ `
uniform sampler2D uCloudTexture;
uniform vec3 uSunDirection;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 normal = normalize(vNormal);

    // Cloud density from texture (green channel of specularClouds or alpha/rgb)
    vec4 cloudSample = texture(uCloudTexture, vUv);
    float cloudAlpha = cloudSample.g; // specularClouds green channel is clouds
    if (cloudAlpha < 0.05) {
        cloudAlpha = cloudSample.r; // fallback if single-channel cloud texture
    }
    cloudAlpha = smoothstep(0.50, 0.95, cloudAlpha) * 0.32; // BEFORE: smoothstep(0.18, 0.85) * 0.78

    if (cloudAlpha < 0.01) {
        discard;
    }

    // Sun orientation for lighting clouds
    float sunOrientation = dot(uSunDirection, normal);
    float dayMix = smoothstep(-0.2, 0.45, sunOrientation);

    // Day clouds are brilliant white; night clouds subtly catch faint twilight
    vec3 dayCloudColor = vec3(0.96, 0.98, 1.0);
    vec3 nightCloudColor = vec3(0.04, 0.06, 0.12);
    vec3 cloudColor = mix(nightCloudColor, dayCloudColor, dayMix);

    // Subtle edge fade for soft atmospheric puff
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float edgeAlpha = dot(-viewDirection, normal);
    edgeAlpha = smoothstep(0.0, 0.25, edgeAlpha);

    gl_FragColor = vec4(cloudColor, cloudAlpha * edgeAlpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export const atmosphereVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

    vNormal = modelNormal;
    vPosition = modelPosition.xyz;
}
`;

export const atmosphereFragmentShader = /* glsl */ `
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    // Sun orientation
    float sunOrientation = dot(uSunDirection, normal);

    // Atmosphere color
    float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    color = mix(color, atmosphereColor, atmosphereDayMix);
    color += atmosphereColor * 0.6;

    // Alpha falloff for smooth outer haze
    float edgeAlpha = dot(viewDirection, normal);
    edgeAlpha = smoothstep(0.0, 0.5, edgeAlpha);
    float dayAlpha = smoothstep(-0.5, 0.0, sunOrientation);
    float alpha = edgeAlpha * dayAlpha * 0.9;

    gl_FragColor = vec4(color, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;
