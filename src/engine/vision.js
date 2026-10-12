/**
 * Adaptation du SITE ENTIER à la vision des couleurs (daltonisme).
 *
 * Deux leviers, cumulables :
 *  1. Jetons de couleur de l'interface remplacés par une palette sûre pour le type
 *     de daltonisme (voir global.css, [data-cvd=…]) + motifs et contours épais
 *     sur les états sélectionnés : aucune information par la couleur seule.
 *  2. Option « correction des couleurs » : filtre SVG (feColorMatrix) de
 *     daltonisation appliqué à toute l'application, scènes 3D comprises.
 *     Méthode : D = I + E · (I − S), où S simule la déficience (Machado 2009,
 *     sévérité 1) et E redistribue l'information perdue vers les canaux perçus.
 */

export const CVD_TYPES = ['none', 'protan', 'deutan', 'tritan', 'achro'];

const SIM = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};
const SHIFT = {
  // rouge-vert : l'écart perdu est envoyé vers la clarté et le bleu
  protan: [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]],
  deutan: [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]],
  // bleu-jaune : l'écart perdu est envoyé vers le rouge et le vert
  tritan: [[1, 0, 0.7], [0, 1, 0.7], [0, 0, 0]],
};

const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const mul = (a, b) => a.map((row) => b[0].map((_, j) => row.reduce((n, v, k) => n + v * b[k][j], 0)));
const sub = (a, b) => a.map((row, i) => row.map((v, j) => v - b[i][j]));
const add = (a, b) => a.map((row, i) => row.map((v, j) => v + b[i][j]));

/** Matrice 3×3 de correction pour un type ; null si aucune correction n'a de sens. */
export function correctionMatrix(type) {
  if (!SIM[type]) return null;
  return add(I3, mul(SHIFT[type], sub(I3, SIM[type])));
}

/** Valeurs « values » d'un feColorMatrix 4×5 (alpha inchangé). */
export function feValues(m3) {
  // chaque ligne : R G B A décalage (5 valeurs)
  const r = (row) => [...row.map((v) => Number(v.toFixed(4))), 0, 0];
  return [...r(m3[0]), ...r(m3[1]), ...r(m3[2]), 0, 0, 0, 1, 0].join(' ');
}

/** Filtre de renforcement du contraste pour une vision sans couleurs (achromatopsie). */
export const ACHRO_VALUES = '0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0';

/** Suggestion du type à partir du mini-test (paires de couleurs vues ou non). */
export function cvdFromTest({ redGreen, blueYellow, anyColor }) {
  if (anyColor === false) return 'achro';
  if (redGreen === false && blueYellow === false) return 'achro';
  if (redGreen === false) return 'deutan';
  if (blueYellow === false) return 'tritan';
  return 'none';
}
