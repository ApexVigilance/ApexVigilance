
export default {
  "common": {
    "back": "Terug",
    "close": "Sluiten",
    "loading": "Laden...",
    "save": "Opslaan",
    "cancel": "Annuleren",
    "soon": "Binnenkort beschikbaar",
    "details": "Details",
    "status": "Status",
    "actions": "Acties",
    "search": "Zoeken...",
    "refresh": "Ververs",
    "edit": "Bewerken",
    "date": "Datum",
    "print": "Afdrukken"
  },
  "nav": {
    "dashboard": "Dashboard",
    "personeel": "Personeelsbestand",
    "planning": "Planning",
    "shifts": "Shifts & Opdrachten",
    "tijdregistraties": "Tijdregistraties",
    "rapporten": "Rapporten",
    "incidenten": "Incidenten & Klachten",
    "klanten": "Klanten & Locaties",
    "facturatie": "Facturatie & Export"
  },
  "compliance": {
    "title": "Naleving & Kwaliteit",
    "compliant": "Conform",
    "partial": "Gedeeltelijk",
    "nonCompliant": "Niet Conform"
  },
  "roles": {
    "guard": "Agent",
    "senior": "Teamleider"
  },
  "incidenten": {
    "title": "Incidenten",
    "subtitle": "Incident management en klachtenafhandeling",
    "newTitle": "Incident Melden",
    "detailTitle": "Incident Dossier",
    "newTab": "Nieuw",
    "mineTab": "Mijn Incidenten",
    "notFound": "Dossier niet gevonden.",
    "isDraft": "Dit is een concept.",
    "noContext": "Geen context",
    "confirmArchive": "Weet je zeker dat je dit dossier wilt archiveren? Het verdwijnt uit het actieve overzicht.",
    "photoLimit": "Maximaal 3 foto's toegestaan.",
    "priorityLabel": "Prioriteit",
    "emptyList": "Geen dossiers gevonden in deze status.",
    "status": {
        "Draft": "Concept",
        "Submitted": "Ingediend",
        "Approved": "Goedgekeurd",
        "Rejected": "Teruggestuurd",
        "Archived": "Gearchiveerd"
    },
    "tabs": {
        "submitted": "Ingediend",
        "approved": "Goedgekeurd",
        "rejected": "Teruggestuurd",
        "archived": "Archief",
        "all": "Alles"
    },
    "types": {
        "incident": "Incident Rapport",
        "complaint": "Klachten Dossier"
    },
    "severity": {
        "Low": "Laag",
        "Medium": "Middel",
        "High": "Hoog",
        "Critical": "Kritiek"
    },
    "fields": {
        "title": "Titel",
        "description": "Beschrijving",
        "photos": "Bewijsmateriaal",
        "severity": "Ernst",
        "author": "Auteur"
    },
    "actions": {
        "archive": "Archiveren"
    },
    "validation": {
        "required": "Vul alle verplichte velden in."
    },
    "communication": "Communicatie",
    "commentPlaceholder": "Schrijf een interne opmerking...",
    "agent": {
        "linkedShift": "Gekoppeld aan Shift",
        "selectClient": "Selecteer Klant...",
        "selectLocation": "Selecteer Locatie (Optioneel)...",
        "selectShift": "Selecteer Shift (Optioneel)...",
        "titlePlaceholder": "Korte omschrijving...",
        "descPlaceholder": "Wat is er gebeurd? Wie was betrokken?",
        "maxPhotos": "Max 3",
        "addPhoto": "Toevoegen",
        "emptyMine": "Geen incidenten gevonden.",
        "photoError": "Fout bij verwerken foto."
    },
    "alerts": {
        "emailSuccess": "E-mail succesvol verzonden.",
        "emailFail": "Verzenden mislukt: "
    },
    "emailTemplate": {
        "greeting": "Beste,",
        "body": "Hierbij ontvangt u het incident rapport <b>{{id}}</b>.",
        "noteLabel": "Opmerking:",
        "signatureLine1": "Met vriendelijke groeten,",
        "signatureLine2": "Apex Vigilance Group"
    },
    "email": {
      "send": "Verstuur E-mail",
      "resend": "Opnieuw Versturen",
      "sendTitle": "Dossier Mailen",
      "recipients": "Ontvangers",
      "commaSeparated": "(komma gescheiden)",
      "placeholder": "email@klant.be, manager@apex.be",
      "subject": "Onderwerp",
      "defaultSubject": "Incident: {{title}}",
      "message": "Boodschap",
      "messagePlaceholder": "Typ hier een begeleidend schrijven...",
      "attachmentInfo": "PDF Rapport wordt automatisch toegevoegd als bijlage.",
      "sending": "Verzenden...",
      "sent": "Verzonden",
      "failed": "Mislukt",
      "confirmSend": "Versturen"
    },
    "pdf": {
      "internalComments": "Interne Opmerkingen",
      "shiftContext": "Shift Context",
      "client": "Klant",
      "date": "Datum",
      "author": "Auteur",
      "message": "Bericht"
    }
  },
  "reports": {
    "title": "Rapporten",
    "subtitle": "Dagrapportages en incidenten",
    "new": "Nieuw Rapport",
    "mine": "Mijn Rapporten",
    "templates": "Sjablonen",
    "modalTitle": "Nieuw Rapport (Admin)",
    "linkShift": "Koppel aan Shift (Optioneel)",
    "noShift": "-- Geen Shift --",
    "startDraft": "Start Concept",
    "typeLabel": "Type Rapport",
    "types": {
      "Daily": "Dagrapport",
      "Incident": "Incidentrapport",
      "Patrol": "Patrouilleverslag",
      "Other": "Anders"
    },
    "status": {
      "Draft": "Concept",
      "Submitted": "Ingediend",
      "Approved": "Goedgekeurd",
      "Rejected": "Teruggestuurd"
    },
    "severity": {
      "Low": "Laag",
      "Medium": "Middel",
      "High": "Hoog",
      "Critical": "Kritiek"
    },
    "fields": {
      "summary": "Samenvatting",
      "details": "Details",
      "category": "Categorie",
      "location": "Locatie",
      "actions": "Genomen Acties",
      "involved": "Betrokken Partijen",
      "vehicle": "Voertuig Info",
      "followUp": "Opvolging Supervisor?",
      "activities": "Activiteiten",
      "clientNotes": "Opmerking voor Klant",
      "internalNotes": "Interne Notities (Admin)",
      "photos": "Foto's & Bijlagen"
    },
    "actions": {
      "saveDraft": "Opslaan als concept",
      "submit": "Indienen",
      "approve": "Goedkeuren",
      "reject": "Terugsturen",
      "exportPdf": "PDF Exporteren",
      "print": "Afdrukken",
      "download": "Download PDF",
      "selectLocation": "Selecteer Locatie",
      "resendEmail": "E-mail Opnieuw Verzenden"
    },
    "email": {
        "sent": "E-mail Verzonden",
        "failed": "E-mail Mislukt",
        "pending": "Bezig met verzenden...",
        "none": "Niet gemaild"
    },
    "audit": {
        "created": "Aangemaakt",
        "submitted": "Ingediend",
        "approved": "Goedgekeurd",
        "rejected": "Teruggestuurd"
    }
  },
  "feedback": {
      "titleFallback": "Feedback Vereist",
      "description": "Geef een duidelijke reden op voor het terugsturen van dit rapport. Minimaal 10 tekens.",
      "placeholder": "Reden voor afkeuring...",
      "chars": "tekens"
  },
  "print": {
      "deprecated": {
          "title": "Print View Deprecated",
          "desc": "U wordt doorgestuurd naar de dossier detailpagina. Gebruik daar de knoppen \"Download PDF\" of \"Afdrukken\"."
      }
  },
  "dashboard": {
    "title": "Operationeel Overzicht",
    "subtitle": "Real-time status van Apex Vigilance Group",
    "live": "LIVE",
    "kpi": {
      "activeShifts": "Actieve Diensten",
      "openIncidents": "Open Incidenten",
      "totalGuards": "Totaal Personeel"
    },
    "activity": {
      "title": "Live Activiteiten",
      "empty": "Geen recente activiteit.",
      "status": {
        "info": "INFO",
        "alert": "ALARM",
        "success": "OK"
      }
    },
    "quickActions": {
      "title": "Snelle Acties"
    },
    "action": {
      "newShift": "Nieuwe Dienst",
      "reportIncident": "Incident Melden",
      "timeLogs": "Tijdregistraties",
      "reports": "Rapportages"
    }
  },
  "personeel": {
    "title": "Personeelsbestand",
    "subtitle": "Beheer van beveiligers en staf",
    "filter": {
      "all": "Alle",
      "active": "Actief",
      "inactive": "Inactief",
      "expiring": "Badge Vervalt Bijna",
      "missing": "Docs Ontbreken",
      "badge60": "Badge < 60d",
      "badge30": "Badge < 30d",
      "badgeExpired": "Badge Verlopen"
    },
    "tabs": {
      "profile": "Profiel",
      "contract": "Contract & Tarief",
      "qualifications": "Kwalificaties",
      "availability": "Beschikbaarheid",
      "documents": "Documenten",
      "history": "Historiek"
    },
    "statusModal": {
      "title": "Status Wijzigen",
      "reasonLabel": "Reden voor wijziging (verplicht)",
      "confirm": "Bevestigen"
    },
    "badge": {
        "title": "Badge Informatie",
        "expiry": "Vervaldatum",
        "number": "Badge Nummer",
        "photo": "Badge Foto",
        "upload": "Nieuwe Foto",
        "status": {
            "valid": "Geldig",
            "warning60": "Vervalt < 60d",
            "warning30": "Vervalt < 30d",
            "expired": "VERLOPEN",
            "unknown": "Onbekend"
        }
    }
  },
  "planning": {
    "title": "Planning",
    "subtitle": "Roosters en beschikbaarheid",
    "exeLabel": "Functiecode (EXE) — optioneel",
    "requirements": "Vereisten (optioneel)"
  },
  "shifts": {
    "title": "Shifts & Opdrachten",
    "subtitle": "Actieve en geplande diensten",
    "detailTitle": "Shift Details",
    "tabs": {
      "mine": "Mijn Shifts",
      "applications": "Aanvragen",
      "open": "Open Shifts"
    },
    "status": {
      "pending": "Wacht op goedkeuring",
      "approved": "Goedgekeurd",
      "rejected": "Geweigerd",
      "withdrawn": "Ingetrokken",
      "open": "OPEN",
      "full": "VOLZET"
    },
    "empty": {
      "mine": "Geen geplande shifts.",
      "applications": "Geen aanvragen.",
      "open": "Geen open shifts gevonden."
    },
    "actions": {
      "viewOpen": "Open Shifts bekijken",
      "resetFilter": "Toon alle periodes",
      "withdraw": "Aanvraag intrekken",
      "apply": "Opgeven voor deze shift"
    },
    "period": {
      "all": "Alle periodes",
      "today": "Vandaag",
      "week": "Deze week",
      "month": "Deze maand"
    },
    "monitor": {
      "title": "Status Tijdregistratie",
      "subtitle": "Huidige status van toegewezen personeel",
      "offline": "Geen actieve registraties",
      "clockedIn": "Ingeklokt"
    }
  },
  "tijd": {
    "title": "Tijdregistraties",
    "subtitle": "In- en uitklok logboek",
    "shiftCancelled": "Shift geannuleerd",
    "manualReg": "Handmatige tijdregistratie",
    "agent": {
        "title": "Tijdregistratie",
        "clockIn": "Inklokken",
        "clockOut": "Uitklokken",
        "pauseStart": "Pauze start",
        "pauseStop": "Pauze stop",
        "notClocked": "Niet ingeklokt",
        "active": "In dienst",
        "paused": "Pauze",
        "checking": "Locatie controleren...",
        "retry": "Opnieuw proberen",
        "inside": "Binnen zone",
        "outside": "Buiten zone",
        "unavailable": "Locatie niet beschikbaar",
        "unchecked": "Locatie niet gecontroleerd",
        "exceptionTitle": "Afwijking Bevestigen",
        "photoReq": "Bewijsfoto verplicht",
        "reason": "Reden",
        "reasonPh": "Selecteer reden...",
        "otherReason": "Andere reden...",
        "reasons": {
            "gps": "GPS werkt niet",
            "border": "Ik sta net buiten de zone",
            "entrance": "Startpunt aan andere ingang",
            "other": "Andere reden"
        },
        "confirm": "Bevestigen",
        "warningOut": "Nog niet uitgeklokt"
    },
    "admin": {
        "nazicht": "Nazicht",
        "nazichtTitle": "Nazicht Tijdregistraties",
        "approve": "Goedkeuren",
        "reject": "Afkeuren",
        "comment": "Opmerking",
        "emptyNazicht": "Geen items ter nazicht."
    }
  },
  "klanten": {
    "title": "Klanten & Locaties",
    "subtitle": "CRM en postinstructies",
    "locatiesBtn": "Bekijk Locaties",
    "new": "Nieuwe Klant",
    "newLoc": "Nieuwe Locatie",
    "active": "Actief",
    "inactive": "Inactief",
    "notFound": "Klant niet gevonden.",
    "noLocs": "Geen locaties gevonden.",
    "recentShifts": "Recente Shifts",
    "locationCount": "Locaties",
    "form": {
        "name": "Bedrijfsnaam",
        "vat": "BTW / KBO",
        "contact": "Contactpersoon",
        "email": "Email",
        "phone": "Telefoon",
        "address": "Facturatieadres",
        "city": "Stad / Gemeente",
        "type": "Type Locatie",
        "access": "Toegangsinstructies",
        "locName": "Locatie Naam",
        "locAddress": "Adres",
        "cancel": "Annuleren",
        "create": "Aanmaken"
    },
    "actions": {
        "print": "Fiche Afdrukken",
        "viewMap": "Toon op kaart",
        "viewInvoices": "Factuurhistoriek"
    }
  },
  "facturatie": {
    "title": "Facturatie",
    "subtitle": "Financiële exports en pre-billing",
    "overviewTitle": "Facturen Overzicht",
    "emptyList": "Geen facturen gevonden.",
    "notFound": "Factuur niet gevonden.",
    "confirmSend": "Weet u zeker dat u deze factuur wilt verzenden naar {{email}}?",
    "confirmPaid": "Markeer deze factuur als betaald?",
    "error": {
        "noEmail": "Klant heeft geen e-mailadres."
    },
    "stats": {
        "revenue": "Omzet",
        "drafts": "Concepten",
        "outstanding": "Openstaand",
        "paid": "Betaald"
    },
    "actions": {
        "manage": "Beheer Facturen",
        "export": "Export CSV",
        "send": "Versturen",
        "markPaid": "Markeer Betaald"
    },
    "create": {
        "title": "Nieuwe Facturatieronde",
        "desc": "Selecteer een periode en klantgroep om conceptfacturen te genereren op basis van goedgekeurde shifts.",
        "cta": "Start Facturatie (via Planning)"
    },
    "tabs": {
        "all": "Alle",
        "concept": "Concepten",
        "sent": "Verzonden",
        "paid": "Betaald"
    },
    "status": {
        "Concept": "Concept",
        "Sent": "Verzonden",
        "Paid": "Betaald"
    },
    "export": {
        "title": "Financiële Export",
        "desc": "Download factuurdata voor boekhoudpakketten (CSV formaat).",
        "from": "Datum Van",
        "to": "Datum Tot",
        "download": "Download Export"
    },
    "pdf": {
        "title": "FACTUUR",
        "number": "Factuurnummer",
        "clientDetails": "Factuuradres",
        "details": "Details",
        "dueDate": "Vervaldatum",
        "invoiceDate": "Factuurdatum",
        "period": "Periode",
        "contact": "Contact",
        "dates": "Datums",
        "tel": "Tel",
        "email": "Email",
        "web": "Web",
        "vat": "BTW",
        "col": {
            "desc": "Omschrijving",
            "qty": "Aantal",
            "price": "Prijs",
            "excl": "Totaal Excl.",
            "vat": "BTW",
            "incl": "Totaal Incl."
        },
        "subtotal": "Subtotaal (Excl. BTW)",
        "vatTotal": "Totaal BTW",
        "total": "Totaal te betalen",
        "terms": "Gelieve te betalen voor de vervaldatum met vermelding van het factuurnummer.",
        "paymentTerms1": "Gelieve het totaalbedrag over te maken voor",
        "paymentTerms2": "op rekening:",
        "paymentTerms3": "BIC:",
        "paymentTerms4": "Met vermelding van:"
    },
    "email": {
        "subject": "Factuur",
        "body": "Beste klant, in bijlage vindt u factuur {{number}}.",
        "success": "Factuur succesvol verzonden",
        "fail": "Verzenden factuur mislukt: "
    },
    "locked": "Vergrendeld",
    "ogm": "OGM / Mededeling",
    "auditLog": "Wijzigingsgeschiedenis",
    "downloadError": "Fout bij downloaden PDF"
  }
};
