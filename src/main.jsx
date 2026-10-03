import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { createRoot } from "react-dom/client";

import {
  Canvas,
  useFrame,
  useThree
} from "@react-three/fiber";

import * as THREE from "three";

import "./styles.css";


/* =========================================================
   PHOTO SETTINGS
   =========================================================

   目前全部使用淺灰色 placeholder。

   之後如果要換成你的照片，只需要加入：

   src: "/photos/photo-01.jpg"

   然後把照片放進：

   public/photos/

   ========================================================= */


const PHOTO_ITEMS = [

  {
    id: 0,
    width: 3.8,
    height: 2.7,
    x: -5.5,
    y: 2.5,
    z: -3
  },

  {
    id: 1,
    width: 2.8,
    height: 3.8,
    x: -1,
    y: 4.8,
    z: -8
  },

  {
    id: 2,
    width: 4.6,
    height: 3,
    x: 4.8,
    y: 3,
    z: -12
  },

  {
    id: 3,
    width: 3,
    height: 4,
    x: 8,
    y: -1,
    z: -5
  },

  {
    id: 4,
    width: 4.3,
    height: 2.8,
    x: 3,
    y: -3.8,
    z: -17
  },

  {
    id: 5,
    width: 2.8,
    height: 3.8,
    x: -3.5,
    y: -3,
    z: -13
  },

  {
    id: 6,
    width: 4.5,
    height: 3,
    x: -7.5,
    y: -0.5,
    z: -20
  },

  {
    id: 7,
    width: 3,
    height: 4,
    x: -10,
    y: 3.8,
    z: -11
  },

  {
    id: 8,
    width: 4.8,
    height: 3,
    x: 9.5,
    y: 4.8,
    z: -22
  },

  {
    id: 9,
    width: 3.2,
    height: 4.2,
    x: -2,
    y: 7.2,
    z: -25
  },

  {
    id: 10,
    width: 4.5,
    height: 3,
    x: 6,
    y: -6,
    z: -27
  },

  {
    id: 11,
    width: 3,
    height: 4,
    x: -8.5,
    y: -5.2,
    z: -30
  }

];


/* =========================================================
   INFINITE SPACE SETTINGS
   ========================================================= */


const LOOP_X = 24;

const LOOP_Y = 18;

const LOOP_Z = 36;


/* =========================================================
   CAMERA / INTERACTION SETTINGS
   ========================================================= */


const CAMERA_SETTINGS = {

  startZ: 8,

  fov: 52,

  panStrength: 0.012,

  wheelStrength: 0.018,

  friction: 0.88,

  zoomFriction: 0.84,

  maxPanVelocity: 0.32,

  maxZoomVelocity: 1.8

};


/* =========================================================
   UTILITY
   ========================================================= */


function wrap(value, size) {

  return (
    THREE.MathUtils.euclideanModulo(
      value + size / 2,
      size
    ) - size / 2
  );

}


/* =========================================================
   PHOTO CARD
   ========================================================= */


function PhotoCard({ item }) {

  const [texture, setTexture] = useState(null);


  /*
    如果未設定 src：

    就顯示淺灰 placeholder。

    之後設定：

    src: "/photos/photo-01.jpg"

    就會自動載入照片。
  */


  useEffect(() => {

    if (!item.src) {
      return;
    }


    const loader = new THREE.TextureLoader();


    let active = true;


    loader.load(

      item.src,

      (loadedTexture) => {

        if (!active) {
          return;
        }


        loadedTexture.colorSpace =
          THREE.SRGBColorSpace;


        loadedTexture.minFilter =
          THREE.LinearFilter;


        loadedTexture.magFilter =
          THREE.LinearFilter;


        setTexture(loadedTexture);

      },

      undefined,

      () => {

        if (active) {

          setTexture(null);

        }

      }

    );


    return () => {

      active = false;

    };

  }, [item.src]);


  return (

    <mesh
      position={[
        item.x,
        item.y,
        item.z
      ]}
    >

      <planeGeometry
        args={[
          item.width,
          item.height
        ]}
      />


      {texture ? (

        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          side={THREE.DoubleSide}
        />

      ) : (

        <meshBasicMaterial
          color="#e5e5e5"
          toneMapped={false}
          side={THREE.DoubleSide}
        />

      )}

    </mesh>

  );

}


/* =========================================================
   INFINITE PHOTO FIELD
   ========================================================= */


function InfinitePhotoField({
  controls
}) {

  const group = useRef();


  /*
    建立 3 × 3 × 3 的空間複製。

    因此當使用者一直往前移動時，
    不會碰到真正的邊界。
  */


  const copies = useMemo(() => {

    const result = [];


    for (
      let ix = -1;
      ix <= 1;
      ix++
    ) {

      for (
        let iy = -1;
        iy <= 1;
        iy++
      ) {

        for (
          let iz = -1;
          iz <= 1;
          iz++
        ) {

          for (
            const item of PHOTO_ITEMS
          ) {

            result.push({

              ...item,

              copyX:
                item.x +
                ix * LOOP_X,

              copyY:
                item.y +
                iy * LOOP_Y,

              copyZ:
                item.z +
                iz * LOOP_Z

            });

          }

        }

      }

    }


    return result;

  }, []);


  useFrame(() => {

    if (!group.current) {
      return;
    }


    /*
      將整個照片空間反向移動。

      使用者感受到的是：

      「自己正在穿越照片」
    */


    group.current.position.x =
      -controls.offset.x;


    group.current.position.y =
      -controls.offset.y;


    group.current.position.z =
      -controls.offset.z;


    /*
      無限循環。
    */


    controls.offset.x =
      wrap(
        controls.offset.x,
        LOOP_X
      );


    controls.offset.y =
      wrap(
        controls.offset.y,
        LOOP_Y
      );


    controls.offset.z =
      wrap(
        controls.offset.z,
        LOOP_Z
      );

  });


  return (

    <group ref={group}>

      {copies.map(
        (item, index) => (

          <PhotoCard
            key={`${item.id}-${index}`}
            item={{
              ...item,

              x: item.copyX,
              y: item.copyY,
              z: item.copyZ
            }}
          />

        )
      )}

    </group>

  );

}


/* =========================================================
   CAMERA / DRAG / ZOOM
   ========================================================= */


function CameraRig({
  controls
}) {

  const {
    camera,
    gl
  } = useThree();


  const pointers = useRef(
    new Map()
  );


  const previousPinch =
    useRef(null);


  const drag = useRef({

    active: false,

    x: 0,

    y: 0

  });


  useEffect(() => {

    const element =
      gl.domElement;


    /* -------------------------------------
       POINTER DOWN
       ------------------------------------- */


    const pointerDown =
      (event) => {

        element.setPointerCapture?.(
          event.pointerId
        );


        pointers.current.set(
          event.pointerId,
          {
            x: event.clientX,
            y: event.clientY
          }
        );


        if (
          pointers.current.size === 1
        ) {

          drag.current.active =
            true;


          drag.current.x =
            event.clientX;


          drag.current.y =
            event.clientY;

        }

      };


    /* -------------------------------------
       POINTER MOVE
       ------------------------------------- */


    const pointerMove =
      (event) => {

        if (
          !pointers.current.has(
            event.pointerId
          )
        ) {

          return;

        }


        const previous =
          pointers.current.get(
            event.pointerId
          );


        const dx =
          event.clientX -
          previous.x;


        const dy =
          event.clientY -
          previous.y;


        pointers.current.set(
          event.pointerId,
          {
            x: event.clientX,
            y: event.clientY
          }
        );


        /*
          一指：

          拖曳 3D 空間。
        */


        if (
          pointers.current.size === 1 &&
          drag.current.active
        ) {

          controls.velocity.x -=
            dx *
            CAMERA_SETTINGS.panStrength;


          controls.velocity.y +=
            dy *
            CAMERA_SETTINGS.panStrength;


          controls.velocity.x =
            THREE.MathUtils.clamp(
              controls.velocity.x,
              -CAMERA_SETTINGS.maxPanVelocity,
              CAMERA_SETTINGS.maxPanVelocity
            );


          controls.velocity.y =
            THREE.MathUtils.clamp(
              controls.velocity.y,
              -CAMERA_SETTINGS.maxPanVelocity,
              CAMERA_SETTINGS.maxPanVelocity
            );

        }


        /*
          兩指：

          Pinch zoom。
        */


        if (
          pointers.current.size === 2
        ) {

          const points =
            [...pointers.current.values()];


          const distance =
            Math.hypot(

              points[0].x -
              points[1].x,

              points[0].y -
              points[1].y

            );


          if (
            previousPinch.current !== null
          ) {

            const delta =
              distance -
              previousPinch.current;


            controls.zoomVelocity -=
              delta * 0.01;

          }


          previousPinch.current =
            distance;

        }

      };


    /* -------------------------------------
       POINTER UP
       ------------------------------------- */


    const pointerUp =
      (event) => {

        pointers.current.delete(
          event.pointerId
        );


        if (
          pointers.current.size < 2
        ) {

          previousPinch.current =
            null;

        }


        if (
          pointers.current.size === 0
        ) {

          drag.current.active =
            false;

        }

      };


    /* -------------------------------------
       WHEEL
       ------------------------------------- */


    const wheel =
      (event) => {

        event.preventDefault();


        /*
          Trackpad horizontal movement
        */


        controls.velocity.x +=
          event.deltaX *
          CAMERA_SETTINGS.wheelStrength *
          0.35;


        /*
          Wheel vertical movement：

          向前／向後推進。
        */


        controls.zoomVelocity +=
          event.deltaY *
          CAMERA_SETTINGS.wheelStrength;


        controls.zoomVelocity =
          THREE.MathUtils.clamp(

            controls.zoomVelocity,

            -CAMERA_SETTINGS.maxZoomVelocity,

            CAMERA_SETTINGS.maxZoomVelocity

          );

      };


    element.addEventListener(
      "pointerdown",
      pointerDown
    );


    element.addEventListener(
      "pointermove",
      pointerMove
    );


    element.addEventListener(
      "pointerup",
      pointerUp
    );


    element.addEventListener(
      "pointercancel",
      pointerUp
    );


    element.addEventListener(
      "wheel",
      wheel,
      {
        passive: false
      }
    );


    return () => {

      element.removeEventListener(
        "pointerdown",
        pointerDown
      );


      element.removeEventListener(
        "pointermove",
        pointerMove
      );


      element.removeEventListener(
        "pointerup",
        pointerUp
      );


      element.removeEventListener(
        "pointercancel",
        pointerUp
      );


      element.removeEventListener(
        "wheel",
        wheel
      );

    };

  }, [gl, controls]);


  /* -------------------------------------
     ANIMATION LOOP
     ------------------------------------- */


  useFrame(
    (_, delta) => {

      const panDamping =
        Math.pow(
          CAMERA_SETTINGS.friction,
          delta * 60
        );


      const zoomDamping =
        Math.pow(
          CAMERA_SETTINGS.zoomFriction,
          delta * 60
        );


      /*
        移動
      */


      controls.offset.x +=
        controls.velocity.x *
        delta *
        60;


      controls.offset.y +=
        controls.velocity.y *
        delta *
        60;


      controls.offset.z +=
        controls.zoomVelocity *
        delta *
        60;


      /*
        慣性衰減
      */


      controls.velocity.x *=
        panDamping;


      controls.velocity.y *=
        panDamping;


      controls.zoomVelocity *=
        zoomDamping;


      /*
        Z 軸無限循環
      */


      controls.offset.z =
        wrap(
          controls.offset.z,
          LOOP_Z
        );


      /*
        Camera 保持在中心。

        真正移動的是照片世界。
      */


      camera.position.set(
        0,
        0,
        CAMERA_SETTINGS.startZ
      );


      camera.lookAt(
        0,
        0,
        -10
      );

    }
  );


  return null;

}


/* =========================================================
   THREE SCENE
   ========================================================= */


function Scene() {

  const controls = useMemo(

    () => ({

      offset: {

        x: 0,

        y: 0,

        z: 0

      },

      velocity: {

        x: 0,

        y: 0

      },

      zoomVelocity: 0

    }),

    []

  );


  return (

    <>

      <Canvas

        dpr={[
          1,
          2
        ]}

        camera={{

          position: [
            0,
            0,
            CAMERA_SETTINGS.startZ
          ],

          fov:
            CAMERA_SETTINGS.fov,

          near: 0.1,

          far: 120

        }}

        gl={{

          antialias: true,

          powerPreference:
            "high-performance"

        }}

        onCreated={({
          gl
        }) => {

          gl.setClearColor(
            "#f1f1f1"
          );

        }}

      >

        <CameraRig
          controls={controls}
        />

        <InfinitePhotoField
          controls={controls}
        />

      </Canvas>

    </>

  );

}


/* =========================================================
   APP
   ========================================================= */


function App() {

  return (

    <main className="canvas-page">

      <Scene />

    </main>

  );

}


/* =========================================================
   START REACT
   ========================================================= */


createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <App />

  </React.StrictMode>

);
