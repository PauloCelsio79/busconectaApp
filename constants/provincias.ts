/** Províncias e municípios de Angola. */

export interface ProvinciaComMunicipios {
  provincia: string;
  municipios: string[];
}

/** Dados completos: províncias com os respectivos municípios. */
export const PROVINCIAS_MUNICIPIOS: ProvinciaComMunicipios[] = [
  {
    provincia: 'Bengo',
    municipios: [
      'Ambriz', 'Barra do Dande', 'Bula Atumba', 'Dande', 'Dembos',
      'Muxaluando', 'Nambuangongo', 'Pango Aluquém', 'Piri', 'Quibaxe',
      'Quicunzo', 'Úcua',
    ],
  },
  {
    provincia: 'Benguela',
    municipios: [
      'Baía Farta', 'Balombo', 'Benguela', 'Bocoio', 'Caimbambo',
      'Catumbela', 'Chongorói', 'Cubal', 'Dombe Grande', 'Ganda', 'Lobito',
    ],
  },
  {
    provincia: 'Bié',
    municipios: [
      'Andulo', 'Camacupa', 'Catabola', 'Chinguar', 'Chitembo',
      'Cuemba', 'Cuíto', 'Cunhinga', 'Nhârea',
    ],
  },
  {
    provincia: 'Cabinda',
    municipios: [
      'Belize', 'Buco-Zau', 'Cabinda', 'Cacongo',
    ],
  },
  {
    provincia: 'Cuando Cubango',
    municipios: [
      'Calai', 'Cuangar', 'Cuchi', 'Cuito Cuanavale', 'Dirico',
      'Mavinga', 'Menongue', 'Nancova', 'Rivungo',
    ],
  },
  {
    provincia: 'Cunene',
    municipios: [
      'Cahama', 'Cuanhama', 'Curoca', 'Cuvelai', 'Namacunde', 'Ombadja',
    ],
  },
  {
    provincia: 'Huambo',
    municipios: [
      'Bailundo', 'Cachiungo', 'Caála', 'Chicala-Choloanga', 'Chinjenje',
      'Ecunha', 'Huambo', 'Londuimbali', 'Longonjo', 'Mungo', 'Ucuma',
    ],
  },
  {
    provincia: 'Huíla',
    municipios: [
      'Caconda', 'Cacula', 'Caluquembe', 'Chiange', 'Chibia', 'Chicomba',
      'Chipindo', 'Cuvango', 'Humpata', 'Jamba', 'Lubango', 'Matala',
      'Quilengues', 'Quipungo',
    ],
  },
  {
    provincia: 'Kwanza Norte',
    municipios: [
      'Ambaca', 'Banga', 'Bolongongo', 'Cambambe', 'Cazengo',
      'Golungo Alto', 'Gonguembo', 'Lucala', 'Quiculungo', 'Samba Caju',
    ],
  },
  {
    provincia: 'Kwanza Sul',
    municipios: [
      'Amboim', 'Cassongue', 'Cela', 'Conda', 'Ebo', 'Libolo',
      'Mussende', 'Porto Amboim', 'Quibala', 'Quilenda', 'Seles', 'Sumbe',
    ],
  },
  {
    provincia: 'Luanda',
    municipios: [
      'Belas', 'Cacuaco', 'Cazenga', 'Ícolo e Bengo', 'Luanda',
      'Quiçama', 'Viana',
    ],
  },
  {
    provincia: 'Lunda Norte',
    municipios: [
      'Cambulo', 'Capenda-Camulemba', 'Caungula', 'Chitato', 'Cuango',
      'Cuílo', 'Lubalo', 'Lucapa', 'Xá-Muteba',
    ],
  },
  {
    provincia: 'Lunda Sul',
    municipios: [
      'Cacolo', 'Dala', 'Muconda', 'Saurimo',
    ],
  },
  {
    provincia: 'Malanje',
    municipios: [
      'Cacuso', 'Calandula', 'Cambundi-Catembo', 'Cangandala', 'Caombo',
      'Cuaba Nzoji', 'Cunda-dia-Baze', 'Luquembo', 'Malanje', 'Marimba',
      'Massango', 'Mucari', 'Quela', 'Quirima',
    ],
  },
  {
    provincia: 'Moxico',
    municipios: [
      'Alto Zambeze', 'Bundas', 'Camanongue', 'Léua', 'Luacano',
      'Luau', 'Luchazes', 'Luena', 'Moxico',
    ],
  },
  {
    provincia: 'Namibe',
    municipios: [
      'Bibala', 'Camucuio', 'Moçâmedes', 'Tômbua', 'Virei',
    ],
  },
  {
    provincia: 'Uíge',
    municipios: [
      'Alto Cauale', 'Ambuíla', 'Bembe', 'Buengas', 'Bungo',
      'Damba', 'Macocola', 'Mucaba', 'Negage', 'Puri',
      'Quimbele', 'Quitexe', 'Sanza Pombo', 'Songo', 'Uíge', 'Zombo',
    ],
  },
  {
    provincia: 'Zaire',
    municipios: [
      'Cuimba', 'Mbanza Congo', 'Nóqui', 'Nzeto', 'Soyo', 'Tomboco',
    ],
  },
];

function buildLocalidades(): string[] {
  const set = new Set<string>();
  for (const item of PROVINCIAS_MUNICIPIOS) {
    set.add(item.provincia);
    for (const m of item.municipios) set.add(m);
  }
  return Array.from(set).sort();
}

/**
 * Lista plana de todas as localidades (províncias + municípios),
 * sem duplicados, ordenada alfabeticamente.
 */
export const LOCALIDADES_ANGOLA: string[] = buildLocalidades();
