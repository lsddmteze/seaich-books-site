/* Site settings — edit these, no other file needs changing.
   amazonPaperback / amazonKindle: paste the Amazon product URLs once the book is live
     (until then, buttons go to an Amazon search for the title).
   newsletterEndpoint: "/api/subscribe" sends signups to Kit through the site's own Vercel Function
     (set KIT_API_KEY and KIT_FORM_ID in Vercel → Settings → Environment Variables).
   contactEndpoint: the Formspree form address for the contact, press and course forms,
     e.g. "https://formspree.io/f/xxxxabcd".
   ga4: Google Analytics 4 measurement ID, e.g. "G-XXXXXXXXXX" (leave empty for no analytics). */
window.SITE_CONFIG = {
  amazonPaperback: "",
  amazonKindle: "",
  newsletterEndpoint: "",
  contactEndpoint: "",
  ga4: ""
};
