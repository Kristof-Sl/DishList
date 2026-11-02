export type Lang='nl'|'en'
const D:Record<string,[string,string]>={
email:['E-mail','Email'],password:['Wachtwoord','Password'],login:['Inloggen','Log in'],signup:['Account maken','Create account'],logout:['Uitloggen','Log out'],
to_try:['Nog proberen','To try'],tried:['Geprobeerd','Tried'],all:['Alles','All'],
search_ph:['Zoek op naam of plaats…','Search name or place…'],add:['Plaats toevoegen','Add place'],
empty:['Nog niets in je lijst. Voeg je eerste plek toe.','Nothing here yet. Add your first place.'],
type:['Soort','Type'],cuisine:['Keuken','Cuisine'],price:['Prijs','Price'],min_rating:['Min. sterren','Min. stars'],
near:['In de buurt (km)','Near me (km)'],off:['Uit','Off'],sort:['Sorteren','Sort'],s_new:['Nieuwste','Newest'],s_name:['Naam','Name'],s_rating:['Beoordeling','Rating'],s_dist:['Afstand','Distance'],
type_restaurant:['Restaurant','Restaurant'],type_cafe:['Café','Café'],type_bistro:['Bistro','Bistro'],type_bar:['Bar','Bar'],type_bakery:['Bakkerij','Bakery'],type_takeaway:['Afhaal','Takeaway'],type_other:['Overig','Other'],
osm_search:['Zoek op OpenStreetMap (naam + plaats)','Search OpenStreetMap (name + city)'],go:['Zoeken','Search'],
manual:['Of voeg handmatig toe','Or add manually'],name:['Naam','Name'],address:['Adres / plaats','Address / city'],website:['Website','Website'],
source:['Bron (bv. tip van Anna)','Source (e.g. tip from Anna)'],notes:['Notities','Notes'],save:['Opslaan','Save'],cancel:['Annuleren','Cancel'],back:['Terug','Back'],
delete:['Verwijderen','Delete'],confirm_del:['Zeker verwijderen?','Really delete?'],mark_tried:['Markeer als geprobeerd','Mark as tried'],mark_try:['Terug naar nog proberen','Back to to try'],
visits:['Bezoeken','Visits'],new_visit:['Bezoek loggen','Log a visit'],date:['Datum','Date'],by:['Wie','Who'],with:['Met wie','With'],rating:['Beoordeling','Rating'],
would_return:['Terugkomen?','Return?'],yes:['Ja','Yes'],maybe:['Misschien','Maybe'],no:['Nee','No'],dishes:['Gegeten (komma-gescheiden, optioneel)','Eaten (comma-separated, optional)'],
no_results:['Geen resultaten. Voeg handmatig toe.','No results. Add manually.'],loc_fail:['Locatie niet beschikbaar','Location unavailable'],
list:['Lijst','List'],map:['Kaart','Map'],photo:['Foto toevoegen','Add photo'],
settings:['Instellingen','Settings'],language:['Taal','Language'],theme:['Stijl','Style']}
export const t=(l:Lang,k:string)=>D[k]?D[k][l==='nl'?0:1]:k
