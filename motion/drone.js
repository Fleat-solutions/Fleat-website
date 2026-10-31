// Drone inspiré du Matrice 4D (photo de référence : coque gris clair, fuselage étroit,
// bras longs relevés en V, grosse nacelle caméra à l'avant, feux sur les moteurs).
// Unités en mètres. L'avant pointe vers +x, le haut vers +y, la droite vers +z.
// makeDrone(THREE, RoundedBoxGeometry, options) renvoie { group, setSpin(0..1, t), setLights(on) }.

export function makeDrone(THREE, RoundedBoxGeometry, opts = {}) {
  const o = Object.assign({ body: '#c9ced5', dark: '#2b2f35', accent: '#e6e9ee' }, opts);
  const M = (c, p = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .45, metalness: .1 }, p));
  const root = new THREE.Group();
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const shell = M(o.body), light = M(o.accent, { roughness: .4 }), dark = M(o.dark, { roughness: .6 });
  const glass = M('#0f1726', { roughness: .06, metalness: .9 });

  /* Fuselage étroit et allongé, arêtes chanfreinées */
  const outline = new THREE.Shape(), c = .008;
  [[.1, .034 - c], [.1 - c, .034], [-.1 + c, .038], [-.1, .038 - c], [-.1, -.038 + c], [-.1 + c, -.038], [.1 - c, -.034], [.1, -.034 + c]]
    .forEach(([x, y], i) => i ? outline.lineTo(x, y) : outline.moveTo(x, y));
  outline.closePath();
  const fus = new THREE.ExtrudeGeometry(outline, { depth: .03, bevelEnabled: true, bevelThickness: .005, bevelSize: .005, bevelSegments: 1 });
  fus.rotateX(-Math.PI / 2); fus.translate(0, .03, 0);
  add(fus, shell);
  /* dôme GNSS sur le dessus, carénage arrière */
  const dome = add(new THREE.SphereGeometry(.022, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), light, -.02, .065, 0);
  dome.scale.set(1.3, .55, 1);
  add(new RoundedBoxGeometry(.05, .016, .06, 1, .003), light, -.075, .068, 0);
  /* dessous : radiateur sombre et phare d'atterrissage */
  add(new RoundedBoxGeometry(.13, .01, .05, 1, .002), dark, -.01, .022, 0);
  for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(.11, .002, .002), M('#1c1f24'), -.01, .016, -.02 + i * .008);
  const landing = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.6 });
  add(new THREE.BoxGeometry(.012, .003, .008), landing, .02, .016, 0);

  /* Nacelle caméra à l'avant : bloc massif, face sombre, trois objectifs et télémètre */
  const gimbal = new THREE.Group(); gimbal.position.set(.108, .034, 0); root.add(gimbal);
  add(new RoundedBoxGeometry(.02, .03, .05, 1, .004), shell, -.006, .006, 0, gimbal);
  add(new RoundedBoxGeometry(.05, .052, .066, 1, .006), shell, .024, -.004, 0, gimbal);
  add(new RoundedBoxGeometry(.006, .042, .056, 1, .003), dark, .05, -.004, 0, gimbal);
  [[-.002, -.018, .012], [.012, .01, .009], [-.018, .012, .007]].forEach(([y, z, r]) => {
    const ring = add(new THREE.CylinderGeometry(r + .003, r + .003, .006, 24), M('#3a3f46', { metalness: .4 }), .053, y, z, gimbal); ring.rotation.z = Math.PI / 2;
    const lens = add(new THREE.CylinderGeometry(r, r, .007, 24), glass, .054, y, z, gimbal); lens.rotation.z = Math.PI / 2;
  });
  const lidar = add(new THREE.BoxGeometry(.004, .008, .012), M('#5b2c1e', { roughness: .2 }), .054, -.02, .014, gimbal);
  lidar.castShadow = false;

  /* Bras longs, de section rectangulaire effilée, relevés vers les moteurs */
  const props = [], navMats = [];
  /* hélice de rayon PR (proportions Matrice 4D : rayon d'hélice inférieur à l'écart entre moteurs) */
  const PR = .12, k = PR / .14;
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, -.006); bladeShape.bezierCurveTo(.035 * k, -.014, .1 * k, -.012, .138 * k, -.003);
  bladeShape.bezierCurveTo(.142 * k, 0, .141 * k, .004, .135 * k, .005); bladeShape.bezierCurveTo(.09 * k, .01, .035 * k, .011, 0, .006); bladeShape.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: .002, bevelEnabled: false, curveSegments: 12 }); bladeGeo.rotateX(-Math.PI / 2);
  const ARMS = [
    { from: [.06, .055, .036], to: [.15, .1, .19], front: true },
    { from: [.06, .055, -.036], to: [.15, .1, -.19], front: true },
    { from: [-.075, .058, .04], to: [-.155, .105, .19], front: false },
    { from: [-.075, .058, -.04], to: [-.155, .105, -.19], front: false }
  ];
  ARMS.forEach(({ from, to, front }, i) => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), dir = b.clone().sub(a), len = dir.length();
    /* bras : boîte effilée (plus épaisse côté fuselage) orientée de a vers b */
    const g = new THREE.BoxGeometry(len, .012, .014);
    const pos = g.attributes.position;
    for (let k = 0; k < pos.count; k++) if (pos.getX(k) < 0) { pos.setY(k, pos.getY(k) * 1.5); pos.setZ(k, pos.getZ(k) * 1.35); }
    g.computeVertexNormals(); g.translate(len / 2, 0, 0);
    const arm = add(g, shell, a.x, a.y, a.z);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize());
    /* antenne verticale à mi-bras sur les bras arrière */
    if (!front) { const m = a.clone().lerp(b, .45); add(new RoundedBoxGeometry(.006, .03, .014, 1, .002), shell, m.x, m.y + .018, m.z); }
    /* nacelle moteur et cloche */
    add(new THREE.CylinderGeometry(.015, .016, .028, 16), shell, b.x, b.y + .002, b.z);
    add(new THREE.CylinderGeometry(.01, .012, .006, 16), M('#9aa2ad', { metalness: .6, roughness: .3 }), b.x, b.y + .026, b.z);
    const nav = new THREE.MeshStandardMaterial(front ? { color: '#3ad07a', emissive: '#22c55e', emissiveIntensity: 2.6 } : { color: '#ff6b5f', emissive: '#ff3b30', emissiveIntensity: 2.2 });
    navMats.push(nav);
    /* bandeau lumineux en haut de la nacelle moteur */
    add(new THREE.CylinderGeometry(.0152, .0158, .007, 16), nav, b.x, b.y + .019, b.z);
    /* hélice bipale + disque flou en rotation */
    const prop = new THREE.Group(); prop.position.set(b.x, b.y + .027, b.z); root.add(prop);
    const blades = new THREE.Group(); prop.add(blades);
    [0, Math.PI].forEach(r => { const bl = add(bladeGeo, M('#1d2025', { roughness: .45 }), 0, 0, 0, blades); bl.rotation.y = r; });
    add(new THREE.CylinderGeometry(.007, .007, .006, 16), dark, 0, 0, 0, blades);
    const disc = new THREE.Mesh(new THREE.RingGeometry(.012, PR, 48), new THREE.MeshBasicMaterial({ color: '#8a93a3', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = .001; prop.add(disc);
    props.push({ blades, disc, dir: (i === 0 || i === 3) ? 1 : -1 });
  });
  /* patins sous le fuselage pour se poser sur la plateforme */
  [[.05, .028], [.05, -.028], [-.07, .03], [-.07, -.03]].forEach(([x, z]) => add(new THREE.CylinderGeometry(.005, .006, .016, 10), dark, x, .012, z));

  const PARK = 22 * Math.PI / 180;
  return {
    group: root,
    /* à l'arrêt, les pales se calent à 22° : position qui laisse le plus de marge sous le capot du dock */
    setSpin(spin, t) {
      props.forEach(p => {
        p.blades.rotation.y = p.dir * (PARK + t * 70 * spin);
        p.blades.visible = spin < .7;
        p.disc.material.opacity = .3 * spin;
      });
    },
    setLights(on) { navMats.forEach(m => { m.emissiveIntensity = on ? 2.6 : .3; }); }
  };
}
