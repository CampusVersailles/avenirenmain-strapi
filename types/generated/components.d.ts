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
    latitude: Schema.Attribute.Decimal;
    longitude: Schema.Attribute.Decimal;
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
    metierDisponible: Schema.Attribute.Boolean;
    nom: Schema.Attribute.String;
  };
}

export interface SharedMetierProche extends Struct.ComponentSchema {
  collectionName: 'components_shared_metier_proches';
  info: {
    displayName: 'MetierProche';
  };
  attributes: {
    nom: Schema.Attribute.String;
  };
}

export interface SharedOrigine extends Struct.ComponentSchema {
  collectionName: 'components_shared_origines';
  info: {
    displayName: 'Origine';
  };
  attributes: {
    detailsOrigine: Schema.Attribute.String;
    typeOrigine: Schema.Attribute.Enumeration<
      ['Manuel', 'API', 'Systeme', 'Alternance']
    > &
      Schema.Attribute.Required;
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
      'shared.metier-proche': SharedMetierProche;
      'shared.origine': SharedOrigine;
      'shared.pourquoi-metier': SharedPourquoiMetier;
      'shared.rome-code': SharedRomeCode;
      'shared.rome-domaine-pro': SharedRomeDomainePro;
      'shared.salaire': SharedSalaire;
      'shared.titre-et-description': SharedTitreEtDescription;
    }
  }
}
