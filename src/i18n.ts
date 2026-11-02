export type Lang='nl'|'en'
const D:Record<string,[string,string]>={
email:['E-mail','Email'],password:['Wachtwoord','Password'],login:['Inloggen','Log in'],signup:['Account maken','Create account'],logout:['Uitloggen','Log out'],
to_try:['Te bezoeken','To visit'],tried:['Bezocht','Visited'],all:['Alles','All'],calendar:['Kalender','Calendar'],calendar_years:['Jaren','Years'],calendar_empty:['Geen bezoeken gevonden.','No visits found.'],
search_ph:['Zoek op naam of plaats…','Search name or place…'],add:['Plaats toevoegen','Add place'],
empty:['Nog niets in je lijst. Voeg je eerste plek toe.','Nothing here yet. Add your first place.'],
type:['Soort','Type'],cuisine:['Keuken','Cuisine'],price:['Prijs','Price'],min_rating:['Min. sterren','Min. stars'],
near:['In de buurt (km)','Near me (km)'],off:['Uit','Off'],sort:['Sorteren','Sort'],s_new:['Nieuwste','Newest'],s_name:['Naam','Name'],s_rating:['Beoordeling','Rating'],s_dist:['Afstand','Distance'],
type_restaurant:['Restaurant','Restaurant'],type_cafe:['Café','Café'],type_bistro:['Bistro','Bistro'],type_bar:['Bar','Bar'],type_bakery:['Bakkerij','Bakery'],type_takeaway:['Afhaal','Takeaway'],type_other:['Overig','Other'],
osm_search:['Zoek op OpenStreetMap (naam + plaats)','Search OpenStreetMap (name + city)'],go:['Zoeken','Search'],
manual:['Of voeg handmatig toe','Or add manually'],name:['Naam','Name'],address:['Adres / plaats','Address / city'],website:['Website','Website'],
source:['Bron (bv. tip van Anna)','Source (e.g. tip from Anna)'],notes:['Notities','Notes'],save:['Opslaan','Save'],cancel:['Annuleren','Cancel'],back:['Terug','Back'],
delete:['Verwijderen','Delete'],confirm_del:['Zeker verwijderen?','Really delete?'],mark_tried:['Markeer als bezocht','Mark as visited'],mark_try:['Terug naar te bezoeken','Back to to visit'],
visits:['Bezoeken','Visits'],new_visit:['Bezoek loggen','Log a visit'],edit_visit:['Aanpassen','Edit'],date:['Datum','Date'],by:['Wie','Who'],with:['Met wie','With'],with_two:['met twee','with two'],with_family:['met gezin','with family'],with_others:['met anderen','with others'],rating:['Beoordeling','Rating'],
would_return:['Terugkomen?','Return?'],yes:['Ja','Yes'],maybe:['Misschien','Maybe'],no:['Nee','No'],dishes:['Gegeten (komma-gescheiden, optioneel)','Eaten (comma-separated, optional)'],
total_bill:['Totale rekening','Total bill'],meal_type:['Type maaltijd','Meal type'],takeaway:['Afhaalmaaltijd','Take-away'],dine_in:['Dine-in','Dine-in'],reason:['Reden van bezoek','Reason of visit'],
no_results:['Geen resultaten. Voeg handmatig toe.','No results. Add manually.'],loc_fail:['Locatie niet beschikbaar','Location unavailable'],
list:['Lijst','List'],map:['Kaart','Map'],photo:['Foto toevoegen','Add photo'],
settings:['Instellingen','Settings'],language:['Taal','Language'],theme:['Stijl','Style']}
export const t=(l:Lang,k:string)=>D[k]?D[k][l==='nl'?0:1]:k
