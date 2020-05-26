export const Extent = [0.01, 100];
export const PathStrok = '#c0c0c0';
export const ColorWhite = '#fff';
export const Radius = 15;

export const ForceProps = {
    center: {
        x: 0,
        y: 0
    },
    manyBodyProps: {
        strength: -400,
        distanceMin: 50,
        distanceMax: 500
    },
    linkProps: {
        distance: 30,
    },
    collideProps: {
        radius: Radius,
    },
    // 设置 alpha 衰减率
    alphaDecay: 0.083,
    // alpha 最小阈值
    alphaMin: 0.001,
}

export const CameraPositionZ = 100;

export const TriangleSegments = 32;