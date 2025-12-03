import { compileStrapi, createStrapi } from "@strapi/strapi";
import seedMetiers from "../data/seed_metiers.json";

const appellation = {
  "Apprêteur / Apprêteuse":
    "Opérateur / Opératrice en orfèvrerie et bijouterie",
  "Archetier / Archetière": "Facteur / Factrice d'instruments de musique",
  "Ardoisier / Ardoisière": "Couvreur / Couvreuse",
  "Argenteur et/ou Doreur sur métal / Argenteuse et/ou Doreuse sur métal":
    "Décorateur / Décoratrice d'objets d'art",
  "Armurier / Armurière d'art": "Métallier / Métallière d'art",
  "Artisan surcycleur / Artisane surcycleuse": "",
  "Âtrier / Âtrière": "Maçon / Maçonne",
  "Bijoutier / Bijoutière en métaux précieux": "Bijoutier / Bijoutière",
  "Bijoutier / Bijoutière fantaisie": "Bijoutier / Bijoutière",
  Bombeur: "Souffleur / Souffleuse de verre",
  "Bottier main / Bottière main": "Maroquinier / Maroquinière",
  "Boutonnier / Boutonnière": "Brodeur / Brodeuse",
  "Briquetier / Briquetière": "Maçon / Maçonne",
  "Bronzier / Bronzière": "Métallier / Métallière d'art",
  "Brodeur / Brodeuse à l'aiguille": "Brodeur / Brodeuse",
  "Brodeur / Brodeuse crochet (Lunéville)": "Brodeur / Brodeuse",
  "Brodeur / brodeuse sur machine guidée main": "Brodeur / Brodeuse",
  "Brossier / Brossière": "Brodeur / Brodeuse",
  Calligraphe: "Artiste plasticien / plasticienne",
  Campaniste: "Métallier / Métallière d'art",
  "Canneur rempailleur / Canneuse rempailleuse": "Vannier / Vannière",
  "Cartonnier / Cartonnière": "Artiste plasticien / plasticienne",
  "Carrossier / Carrossière de véhicules de collection": "",
  "Charron / Charronne": "Métallier / Métallière d'art",
  Chaîniste: "Opérateur / Opératrice en orfèvrerie et bijouterie",
  "Chapelier / Chapelière et Modiste": "Chapelier / Chapelière",
  "Charpentier de marine / Charpentière de marine":
    "Charpentier / Charpentière",
  "Chaumier / Chaumière": "Couvreur / Couvreuse",
  "Chef / Cheffe de projet en valorisation des matériaux": "",
  "Cirier / Cirière": "Décorateur / Décoratrice d'objets d'art",
  "Ciseleur / Ciseleuse": "Graveur / Graveuse d'art",
  Cornier: "Décorateur / Décoratrice d'objets d'art",
  "Corsetier / Corsetière": "Couturier / Couturière",
  "Coupeur / Coupeuse": "Couturier / Couturière",
  "Coutelier / Coutelière": "Métallier / Métallière d'art",
  "Couturier / Couturière flou": "Couturier / Couturière",
  "Couvreur du patrimoine bâti / Couvreuse du patrimoine bâti":
    "Couvreur / Couvreuse",
  "Couvreur ornemaniste / Couvreuse ornemaniste": "Couvreur / Couvreuse",
  "Décorateur / Décoratrice en résine":
    "Opérateur / Opératrice en orfèvrerie et bijouterie",
  "Décorateur sur céramique / Décoratrice sur céramique": "Céramiste d'art",
  "Dentellier / Dentellière": "Brodeur / Brodeuse",
  "Dentellier / Dentellière au fuseau": "Brodeur / Brodeuse",
  "Dentellier / Dentellière à l'aiguille": "Brodeur / Brodeuse",
  Diamantaire: "Lapidaire / Diamantaire",
  "Dinandier / Dinandière": "Métallier / Métallière d'art",
  "Dominotier / Dominotière": "Décorateur / Décoratrice d'objets d'art",
  "Doreur / Doreuse": "Décorateur / Décoratrice d'objets d'art",
  "Doreur sur cuir / Doreuse sur cuir":
    "Décorateur / Décoratrice d'objets d'art",
  "Doreur / Doreuse sur tranche": "Décorateur / Décoratrice d'objets d'art",
  Écailliste: "Sculpteur / Sculptrice sur bois",
  "Émailleur sur cadrans / Émailleuse sur cadrans": "Horloger / Horlogère",
  "Émailleur sur lave / Émailleuse sur lave":
    "Décorateur / Décoratrice d'objets d'art",
  "Émailleur sur métal / Émailleuse sur métal":
    "Décorateur / Décoratrice d'objets d'art",
  "Émailleur sur terre / Émailleuse sur terre": "Céramiste d'art",
  "Encadreur / Encadreuse": "Sculpteur / Sculptrice sur bois",
  "Enlumineur / Enlumineuse": "Artiste plasticien / plasticienne",
  "Ennoblisseur / Ennoblisseuse textile": "Imprimeur / imprimeuse textile",
  "Escaliéteur / Escaliéteuse": "Charpentier / Charpentière",
  Eventailliste: "Brodeur / Brodeuse",
  "Fabricant / Fabricante d'accessoires de spectacle": "Menuisier / Menuisière",
  "Fabricant / Fabricante de décors de spectacle": "Menuisier / Menuisière",
  "Fabricant / Fabricante d'anches":
    "Facteur / Factrice d'instruments de musique",
  "Fabricant / Fabricante de luminaires":
    "Décorateur / Décoratrice d'objets d'art",
  "Fabricant / Fabricante d'abat-jour":
    "Décorateur / Décoratrice d'objets d'art",
  "Fabricant / fabricante d'automates": "Horloger / Horlogère",
  "Fabricant de chaussures / Fabricante de chaussures":
    "Maroquinier / Maroquinière",
  "Fabricant d’objets en papier et/ou carton / Fabricante d’objets en papier et/ou carton":
    "Artiste plasticien / plasticienne",
  "Fabricant / Fabricante d'objets en textiles":
    "Artiste plasticien / plasticienne",
  "Fabricant de bardeaux et de lattes / Fabricante de bardeaux et de lattes":
    "Charpentier / Charpentière",
  "Fabricant de carreaux / Fabricante de carreaux": "Carreleur / Carreleuse",
  "Fabricant / Fabricantes de coiffes": "Chapelier / Chapelière",
  "Fabricant de compositions et décors végétaux stables et durables / Fabricante de compositions et décors végétaux stables et durables":
    "Artiste plasticien / plasticienne",
  "Fabricant de girouettes et d’éléments de faîtage / Fabricante de girouettes et d’éléments de faîtage":
    "Couvreur / Couvreuse",
  "Fabricant de papier / Fabricante de papier": "Relieur / relieuse",
  "Fabricant de papier peint / Fabricante de papier peint":
    "Décorateur / Décoratrice d'objets d'art",
  "Fabricant / Fabricante de parapluies:parasols:ombrelles et cannes":
    "Styliste",
  "Fabricant de serrures / Fabricante de serrures":
    "Métallier / Métallière d'art",
  "Fabricant de tapis et/ou tapisserie / Fabricante de tapis et/ou tapisserie":
    "Tapissier / Tapissière d'ameublement",
  "Fabricant / Fabricante de jeux": "Sculpteur / Sculptrice sur bois",
  "Fabricant / Fabricante de jouets": "Sculpteur / Sculptrice sur bois",
  "Fabricant / Fabricante de poupées ou de peluches de collection":
    "Artiste plasticien / plasticienne",
  "Fabricant / Fabricante de figurines": "Artiste plasticien / plasticienne",
  "Fabricant / Fabricante de manèges":
    "Assembleur / Assembleuse d'ouvrages en bois",
  "Fabricant / Fabricante de maquettes": "Artiste plasticien / plasticienne",
  "Fabricant / Fabricante de marionnettes": "Accessoiriste",
  "Fabricant / Fabricante de masques": "Accessoiriste",
  "Facteur / Factrice d'instruments à vent":
    "Facteur / Factrice d'instruments de musique",
  "Facteur / Factrice d'instruments à vent-bois":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur d’instruments à vent en métal / Factrice et/ou restauratrice d’instruments à vent en métal":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur de percussions / Factrice et/ou restauratrice de percussions":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur de pianos / Factrice et/ou restauratrice de pianos":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur d’accordéons / Factrice et/ou restauratrice d’accordéons":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur de harpes / Factrice et/ou restauratrice de harpes":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur d’harmoniums / Factrice et/ou restauratrice d’harmoniums":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur d’instruments à claviers / Factrice et/ou restauratrice d’instruments à claviers":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur d’instruments de musique mécanique / Factrice et/ou restauratrice d’instruments de musique mécanique":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur d’orgues / Factrice et/ou restauratrice d’orgues":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur de clavecins et épinettes / Factrice et/ou restauratrice de clavecins et épinettes":
    "Facteur / Factrice d'instruments de musique",
  "Facteur et/ou restaurateur d’instruments traditionnels / Factrice et/ou restauratrice d’instruments traditionnels":
    "Facteur / Factrice d'instruments de musique",
  Féron: "Métallier / Métallière d'art",
  "Ferronnier-forgeron / Ferronnière-forgeronne":
    "Métallier / Métallière d'art",
  "Feutrier / Feutrière": "Brodeur / Brodeuse",
  "Fondeur / Fondeuse": "Métallier / Métallière d'art",
  "Fondeur d’étain / Fondeuse d’étain": "Métallier / Métallière d'art",
  "Fondeur / Fondeuse de caractères": "Graveur / Graveuse d'art",
  "Fondeur / Fondeuse de cloches et sonnailles": "Métallier / Métallière d'art",
  "Fontainier / Fontainière": "Tailleur / Tailleuse de pierre",
  "Fourreur / Fourreuse": "Couturier / Couturière",
  "Formier / Formière": "Sculpteur / Sculptrice sur bois",
  "Gainier / Gainière": "Maroquinier / Maroquinière",
  "Gantier / Gantière": "Maroquinier / Maroquinière",
  Fresquiste: "Artiste plasticien / plasticienne",
  "Gaufreur sur cuir / Gaufreuse sur cuir": "Maroquinier / Maroquinière",
  "Gaufreur sur textile / Gaufreuse sur textile": "Brodeur / Brodeuse",
  "Glypticien / Glypticienne":
    "Opérateur / Opératrice en orfèvrerie et bijouterie",
  "Graveur et imprimeur / graveur et imprimeuse en gaufrage":
    "Graveur / Graveuse d'art",
  "Graveur de poinçons / Graveure de poinçons": "Graveur / Graveuse d'art",
  "Graveur héraldiste / Graveuse héraldiste": "Graveur / Graveuse d'art",
  "Graveur médailleur / Graveuse médailleuse": "Graveur / Graveuse d'art",
  "Graveur / Graveuse sur pierre": "Graveur / Graveuse d'art",
  "Graveur / Graveuse sur verre": "Graveur / Graveuse d'art",
  "Graveur / Graveuse sur ivoire et autres matériaux d'origine animale":
    "Graveur / Graveuse d'art",
  "Ivoirier / Ivoirière": "Sculpteur / Sculptrice sur bois",
  "Guillocheur / Guillocheuse": "Graveur / Graveuse d'art",
  "Imagier / Imagière en pochoir": "Décorateur / Décoratrice d'objets d'art",
  "Imprimeur / Imprimeuse": "Décorateur / Décoratrice d'objets d'art",
  "Imprimeur / Imprimeuse en héliogravure":
    "Décorateur / Décoratrice d'objets d'art",
  "Imprimeur / Imprimeuse en lithographie":
    "Décorateur / Décoratrice d'objets d'art",
  "Imprimeur en risographie / Imprimeuse en risographie":
    "Décorateur / Décoratrice d'objets d'art",
  "Imprimeur en sérigraphie / Imprimeuse en sérigraphie":
    "Décorateur / Décoratrice d'objets d'art",
  "Imprimeur / Imprimeuse en typographie":
    "Décorateur / Décoratrice d'objets d'art",
  "Imprimeur-graveur / Imprimeuse-graveuse en taille-douce":
    "Graveur / Graveuse",
  "Jardinier du patrimoine / Jardinière du patrimoine":
    "Jardinier / Jardinière",
  Lapidaire: "Lapidaire / Diamantaire",
  "Lapidaire tourneur sur pierres dures et fines / Lapidaire tourneuse sur pierres dures et fines":
    "Lapidaire / Diamantaire",
  "Laqueur / Laqueuse": "Décorateur / Décoratrice d'objets d'art",
  "Lauzier / Lauzière ou Lavier / Lavière": "Couvreur / Couvreuse",
  "Lissier basse-lice / Lissière basse-lice": "Brodeur / Brodeuse",
  "Lissier haute-lice / Lissière haute-lice": "Brodeur / Brodeuse",
  "Lissier savonnerie / Lissière savonnerie": "Brodeur / Brodeuse",
  "Luthier en guitare et/ou restaurateur de guitares / Luthière en guitare et/ou restauratrice de guitares":
    "Facteur / Factrice d'instruments de musique",
  "Luthier et/ou restaurateur d’instruments à cordes frottées / Luthière et/ou restauratrice d’instruments à cordes frottées":
    "Facteur / Factrice d'instruments de musique",
  "Maçon du patrimoine bâti / Maçonne du patrimoine bâti": "Maçon / Maçonne",
  "Maître verrier / Vitrailliste": "Souffleur / Souffleuse de verre",
  "Malletier / Malletière et Layetier / Layetière":
    "Maroquinier / Maroquinière",
  "Marbreur sur papier / Marbreuse sur papier":
    "Artiste plasticien / plasticienne",
  "Marbrier / Marbrière": "Tailleur / Tailleuse de pierre",
  "Marqueteur / Marqueteuse de pierres dures": "Tailleur / Tailleuse de pierre",
  "Marqueteur / Marqueteuse": "Sculpteur / Sculptrice sur bois",
  "Marqueteur de pailles / Marqueteuse de pailles":
    "Sculpteur / Sculptrice sur bois",
  "Menuisier en sièges / Menuisière en sièges": "Ébéniste",
  "Modeleur-Mouleur / Modeleuse-Mouleuse (métal)": "Modeleur / Modeleuse",
  Modéliste: "Couturier / Couturière",
  "Miroitier-argenteur / Miroitière-argenteuse":
    "Décorateur / Décoratrice d'objets d'art",
  "Monnayeur de monnaies ou de médailles / Monnayeuse de monnaies ou de médailles":
    "Opérateur / Opératrice en orfèvrerie et bijouterie",
  Mosaïste: "Artiste plasticien / plasticienne",
  "Murailler / Muraillère": "Maçon / Maçonne",
  "Mouleur / Mouleuse": "Modeleur / Modeleuse",
  "Nacrier / Nacrière": "Sculpteur / Sculptrice sur bois",
  Orfèvre: "Opérateur / Opératrice en orfèvrerie et bijouterie",
  "Parcheminier / Parcheminière": "Maroquinier / Maroquinière",
  "Pareur / Pareuse": "Maroquinier / Maroquinière",
  "Parqueteur / Parqueteuse": "Carreleur / Carreleuse",
  "Parurier / Parurière floral": "Brodeur / Brodeuse",
  "Passementier / Passementière": "Brodeur / Brodeuse",
  "Patineur / Patineuse": "Décorateur / Décoratrice d'objets d'art",
  "Peintre en décor": "Décorateur / Décoratrice d'objets d'art",
  "Peintre décorateur / décoratrice sur tissu":
    "Décorateur / Décoratrice d'objets d'art",
  "Paveur-dalleur / Paveuse-dalleuse": "Carreleur / Carreleuse",
  "Peintre fileur-doreur / Peintre fileuse-doreuse":
    "Décorateur / Décoratrice d'objets d'art",
  "Peintre sur mobilier": "Ébéniste",
  "Perruquier-posticheur / Perruquière-posticheuse":
    "Maquilleur / Maquilleuse spectacle",
  "Restaurateur / Restauratrice de photographies": "Photographe",
  "Pipier / Pipière": "Sculpteur / Sculptrice sur bois",
  "Plisseur / Plisseuse": "Brodeur / Brodeuse",
  "Plumassier / Plumassière": "Brodeur / Brodeuse",
  "Poêlier / Poêlière": "Métallier / Métallière d'art",
  "Polisseur / Polisseuse":
    "Opérateur / Opératrice en orfèvrerie et bijouterie",
  "Polisseur de verre / Polisseuse de verre": "Souffleur / Souffleuse de verre",
  "Potier / Potière d'étain": "Métallier / Métallière d'art",
  "Préparateur presse-papier / Préparatrice presse-papier":
    "Souffleur / Souffleuse de verre",
  "Restaurateur / restauratrice d'objets scientifiques:techniques:industriels":
    "Décorateur / Décoratrice d'objets d'art",
  "Restaurateur / restauratrice de céramiques": "Céramiste d'art",
  "Restaurateur / restauratrice de cuirs": "Maroquinier / Maroquinière",
  "Restaurateur / restauratrice de documents graphiques et imprimés":
    "Relieur / Relieuse",
  "Restaurateur / restauratrice de métal": "Métallier / Métallière d'art",
  "Restaurateur / restauratrice de meubles": "Ébéniste",
  "Restaurateur / restauratrice de mosaïques": "Tailleur / Tailleuse de pierre",
  "Restaurateur / restauratrice de peintures":
    "Décorateur / Décoratrice d'objets d'art",
  "Restaurateur / restauratrice de sculptures":
    "Artiste plasticien / plasticienne",
  "Restaurateur / restauratrice de textiles": "Brodeur / Brodeuse",
  "Restaurateur / restauratrice de vitraux": "Souffleur / Souffleuse de verre",
  Rocailleur: "Maçon / Maçonne",
  "Sabreur / Sabreuse de velours": "Brodeur / Brodeuse",
  "Santonnier / Santonnière": "Céramiste d'art",
  "Sculpteur sur pierre / Sculptrice sur pierre":
    "Tailleur / Tailleuse de pierre",
  "Sculpteur sur métal / Sculptrice sur métal":
    "Artiste plasticien / plasticienne",
  "Sculpteur sur terre / Sculptrice sur terre":
    "Artiste plasticien / plasticienne",
  "Sellier / Sellière": "Maroquinier / Maroquinière",
  "Sellier-garnisseur / Sellière-garnisseuse": "Maroquinier / Maroquinière",
  "Sellier-harnacheur / Sellière-harnacheuse": "Maroquinier / Maroquinière",
  "Sellier d'ameublement / Sellière d’ameublement":
    "Maroquinier / Maroquinière",
  "Sellier-maroquinier / Sellière-maroquinière": "Maroquinier / Maroquinière",
  "Sérigraphe textile": "Brodeur / Brodeuse",
  "Sertisseur / Sertisseuse":
    "Sertisseur / Sertisseuse en bijouterie ou joaillerie",
  "Staffeur-stucateur / Staffeuse-stucatrice": "Plâtrier / Plâtrière",
  "Tabletier / Tabletière": "Décorateur / Décoratrice d'objets d'art",
  "Tailleur / Tailleuse": "Couturier / Couturière",
  "Tailleur / Tailleuse de pierre": "Tailleur / Tailleuse de pierre",
  "Taillandier / Tallandière": "Métallier / Métallière",
  "Tailleur de verre / Tailleuse de verre": "Souffleur / Souffleuse de verre",
  "Tanneur / Tanneuse et Mégissier / Mégissière": "Maroquinier / Maroquinière",
  "Tapissier d’ameublement et/ou tapissier décorateur / Tapissière d'ameublement et/ou tapissière décoratrice":
    "Tapissier / Tapissière d'ameublement",
  "Tourneur / Tourneuse sur bois": "Sculpteur / Sculptrice sur bois",
  Taxidemiste: "Maroquinier / Maroquinière",
  "Teinturier / Teinturière": "Brodeur / Brodeuse",
  "Tisserand / Tisserande": "Brodeur / Brodeuse",
  "Tisserand / Tisserande à bras": "Brodeur / Brodeuse",
  "Tourneur sur métal / Tourneuse sur métal": "Métallier / Métallière d'art",
  "Treillageur / Treillageuse": "Coffreur / Coffreuse",
  "Tresseur / Tresseuse": "Brodeur / Brodeuse",
  "Tufteur / Tufteuse": "Brodeur / Brodeuse",
  "Tuilier / Tuilière": "Couvreur / Couvreuse",
  Tulliste: "Brodeur / Brodeuse",
  "Veloutier / Veloutière": "Brodeur / Brodeuse",
  "Vernisseur / Vernisseuse": "Décorateur / Décoratrice d'objets d'art",
  "Verrier / Verrière à la main": "Souffleur / Souffleuse de verre",
  "Verrier au chalumeau / Verrière au chalumeau":
    "Souffleur / Souffleuse de verre",
  "Verrier fondeur / Verrière fondeuse": "Souffleur / Souffleuse de verre",
  "Verrier décorateur / Verrière décoratrice":
    "Souffleur / Souffleuse de verre",
  "Restaurateur / restauratrice de verre et de cristal":
    "Décorateur / Décoratrice d'objets d'art",
  "Lunetier / Lunetière": "Styliste",
  "Moireur / Moireuse": "Brodeur / Brodeuse",
};

const main = async () => {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";

  try {
    console.log("Fetching all métiers...\n");

    const metiers = await strapi.documents("api::metier.metier").findMany({
      populate: ["appellations"],
    });

    console.log(`Found ${metiers.length} métiers\n`);

    console.log("═══════════════════════════════════════\n");

    for (const metier of metiers) {
      console.log(`\n📋 ${metier.titre}`);

      const seedMetier = seedMetiers.metiers.find(
        (m: any) => m.titre === metier.titre
      );

      let appellationsToAdd: any[] = [];

      // On recupere les appellations AEM
      if (
        seedMetier &&
        seedMetier.appellations &&
        seedMetier.appellations.length > 0
      ) {
        console.log(
          `   Found ${seedMetier.appellations.length} appellations in seed data`
        );

        appellationsToAdd = seedMetier.appellations
          .filter((nom: string) => nom !== metier.titre)
          .map((nom: string) => {
            const mappedMetier = metiers.find(
              (metier) => metier.titre.toLowerCase() === nom.toLowerCase()
            );
            return {
              nom,
              metier: mappedMetier ? mappedMetier.documentId : null,
            };
          });
      }

      // Si un metier principal, on recupere ses appellations
      const appellationsFromDict = Object.entries(appellation)
        .filter(
          ([appellationNom, parentMetierTitre]) =>
            parentMetierTitre === metier.titre
        )
        .map(([appellationNom]) => {
          const mappedMetier = metiers.find(
            (metier) =>
              metier.titre.toLowerCase() === appellationNom.toLowerCase()
          );
          return {
            nom: appellationNom,
            metier: mappedMetier ? mappedMetier.documentId : null,
          };
        });

      appellationsToAdd = [...appellationsToAdd, ...appellationsFromDict];

      // Si une appellation, on recupere le metier parent et ses autres appellations
      const parentMetierTitre = appellation[metier.titre];
      if (parentMetierTitre) {
        const parentMetier = metiers.find(
          (metier) =>
            metier.titre.toLowerCase() === parentMetierTitre.toLowerCase()
        );

        if (parentMetier) {
          appellationsToAdd.push({
            nom: parentMetierTitre,
            metier: parentMetier.documentId,
          });

          const siblingAppellations = Object.entries(appellation)
            .filter(
              ([appellationNom, parentTitre]) =>
                parentTitre === parentMetierTitre &&
                appellationNom !== metier.titre
            )
            .map(([appellationNom]) => {
              const mappedMetier = metiers.find(
                (metier) =>
                  metier.titre.toLowerCase() === appellationNom.toLowerCase()
              );
              return {
                nom: appellationNom,
                metier: mappedMetier ? mappedMetier.documentId : null,
              };
            });

          appellationsToAdd = [...appellationsToAdd, ...siblingAppellations];
        }
      }

      const uniqueAppellations = Array.from(
        new Map(appellationsToAdd.map((app) => [app.nom, app])).values()
      );

      if (uniqueAppellations.length > 0) {
        await strapi.documents("api::metier.metier").update({
          documentId: metier.documentId,
          data: {
            appellations: uniqueAppellations,
          } as any,
          status: "published",
        });

        console.log(
          `   ✓ Added ${uniqueAppellations.length} appellations to ${metier.titre}`
        );
      } else {
        console.log(`   - No appellations found`);
      }
    }

    console.log("\n═══════════════════════════════════════");
    console.log(`\nTotal: ${metiers.length} métiers processed`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await strapi.destroy();
  }
};

main();
