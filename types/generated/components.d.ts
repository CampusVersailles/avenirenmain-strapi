import type { Schema, Struct } from '@strapi/strapi';

export interface SharedAdresse extends Struct.ComponentSchema {
  collectionName: 'components_shared_adresses';
  info: {
    displayName: 'Adresse';
  };
  attributes: {
    adresseComplete: Schema.Attribute.String;
    codePostal: Schema.Attribute.String;
    complement: Schema.Attribute.String;
    latitude: Schema.Attribute.Float;
    longitude: Schema.Attribute.Float;
    numeroRue: Schema.Attribute.String;
    pays: Schema.Attribute.String;
    rue: Schema.Attribute.String;
    ville: Schema.Attribute.String;
  };
}

export interface SharedAppellation extends Struct.ComponentSchema {
  collectionName: 'components_shared_appellations';
  info: {
    displayName: 'Appellation';
  };
  attributes: {
    metier: Schema.Attribute.Relation<'oneToOne', 'api::metier.metier'>;
    nom: Schema.Attribute.String;
  };
}

export interface SharedBlocContenu extends Struct.ComponentSchema {
  collectionName: 'components_shared_bloc_contenus';
  info: {
    displayName: 'BlocContenu';
  };
  attributes: {
    description: Schema.Attribute.Blocks;
    media: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    titre: Schema.Attribute.String;
  };
}

export interface SharedChiffreCle extends Struct.ComponentSchema {
  collectionName: 'components_shared_chiffre_cle';
  info: {
    displayName: 'ChiffreCl\u00E9';
  };
  attributes: {
    chiffre: Schema.Attribute.Decimal;
    titre: Schema.Attribute.String;
  };
}

export interface SharedContenu extends Struct.ComponentSchema {
  collectionName: 'components_shared_contenus';
  info: {
    displayName: 'Contenu';
  };
  attributes: {
    chiffre: Schema.Attribute.Component<'shared.contenu-chiffres', false>;
    cta: Schema.Attribute.Component<'shared.contenu-cta', false>;
    image: Schema.Attribute.Component<'shared.contenu-image', false>;
    temoignage: Schema.Attribute.Component<'shared.contenu-temoignage', false>;
    texte: Schema.Attribute.Component<'shared.contenu-texte', false>;
  };
}

export interface SharedContenuChiffres extends Struct.ComponentSchema {
  collectionName: 'components_shared_contenu_chiffres';
  info: {
    displayName: 'ContenuChiffres';
  };
  attributes: {
    chiffres: Schema.Attribute.Component<'shared.chiffre-cle', true>;
  };
}

export interface SharedContenuCta extends Struct.ComponentSchema {
  collectionName: 'components_shared_contenu_ctas';
  info: {
    displayName: 'ContenuCTA';
  };
  attributes: {
    cta: Schema.Attribute.String;
    texte: Schema.Attribute.Blocks;
  };
}

export interface SharedContenuImage extends Struct.ComponentSchema {
  collectionName: 'components_shared_contenu_images';
  info: {
    displayName: 'ContenuImage';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    source: Schema.Attribute.String;
    titre: Schema.Attribute.String;
  };
}

export interface SharedContenuTemoignage extends Struct.ComponentSchema {
  collectionName: 'components_shared_contenu_temoignages';
  info: {
    displayName: 'ContenuTemoignage';
  };
  attributes: {
    citation: Schema.Attribute.Blocks;
    source: Schema.Attribute.Blocks;
    titre: Schema.Attribute.String;
  };
}

export interface SharedContenuTexte extends Struct.ComponentSchema {
  collectionName: 'components_shared_contenu_textes';
  info: {
    displayName: 'ContenuTexte';
  };
  attributes: {
    texte: Schema.Attribute.Blocks;
  };
}

export interface SharedElementDeListe extends Struct.ComponentSchema {
  collectionName: 'components_shared_element_de_listes';
  info: {
    displayName: 'ElementDeListe';
  };
  attributes: {
    description: Schema.Attribute.Text;
  };
}

export interface SharedLienMetier extends Struct.ComponentSchema {
  collectionName: 'components_shared_lien_metiers';
  info: {
    displayName: 'LienMetier';
  };
  attributes: {
    metier: Schema.Attribute.Relation<'oneToOne', 'api::metier.metier'>;
    nom: Schema.Attribute.String;
  };
}

export interface SharedPartie extends Struct.ComponentSchema {
  collectionName: 'components_shared_parties';
  info: {
    displayName: 'Partie';
  };
  attributes: {
    sousParties: Schema.Attribute.Component<'shared.sous-partie', true>;
    titre: Schema.Attribute.String;
  };
}

export interface SharedPourquoiMetier extends Struct.ComponentSchema {
  collectionName: 'components_shared_pourquoi_metiers';
  info: {
    displayName: 'PourquoiMetier';
  };
  attributes: {
    environnementTravail: Schema.Attribute.Blocks;
    notes: Schema.Attribute.Blocks;
    opportunites: Schema.Attribute.Blocks;
    statuts: Schema.Attribute.Blocks;
  };
}

export interface SharedRomeCode extends Struct.ComponentSchema {
  collectionName: 'components_shared_rome_codes';
  info: {
    displayName: 'RomeCode';
  };
  attributes: {
    code: Schema.Attribute.String;
  };
}

export interface SharedRomeDomainePro extends Struct.ComponentSchema {
  collectionName: 'components_shared_rome_domaine_pros';
  info: {
    displayName: 'RomeDomainePro';
  };
  attributes: {
    code: Schema.Attribute.String;
    description: Schema.Attribute.String;
  };
}

export interface SharedSalaire extends Struct.ComponentSchema {
  collectionName: 'components_shared_salaires';
  info: {
    displayName: 'Salaire';
  };
  attributes: {
    valeur_basse: Schema.Attribute.Integer;
    valeur_haute: Schema.Attribute.Integer;
  };
}

export interface SharedSousPartie extends Struct.ComponentSchema {
  collectionName: 'components_shared_sous_parties';
  info: {
    displayName: 'SousPartie';
  };
  attributes: {
    contenu: Schema.Attribute.Component<'shared.contenu', true>;
    titre: Schema.Attribute.String;
  };
}

export interface SharedTitreEtDescription extends Struct.ComponentSchema {
  collectionName: 'components_shared_titre_et_descriptions';
  info: {
    displayName: 'TitreEtDescription';
  };
  attributes: {
    description: Schema.Attribute.Blocks;
    titre: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.adresse': SharedAdresse;
      'shared.appellation': SharedAppellation;
      'shared.bloc-contenu': SharedBlocContenu;
      'shared.chiffre-cle': SharedChiffreCle;
      'shared.contenu': SharedContenu;
      'shared.contenu-chiffres': SharedContenuChiffres;
      'shared.contenu-cta': SharedContenuCta;
      'shared.contenu-image': SharedContenuImage;
      'shared.contenu-temoignage': SharedContenuTemoignage;
      'shared.contenu-texte': SharedContenuTexte;
      'shared.element-de-liste': SharedElementDeListe;
      'shared.lien-metier': SharedLienMetier;
      'shared.partie': SharedPartie;
      'shared.pourquoi-metier': SharedPourquoiMetier;
      'shared.rome-code': SharedRomeCode;
      'shared.rome-domaine-pro': SharedRomeDomainePro;
      'shared.salaire': SharedSalaire;
      'shared.sous-partie': SharedSousPartie;
      'shared.titre-et-description': SharedTitreEtDescription;
    }
  }
}
