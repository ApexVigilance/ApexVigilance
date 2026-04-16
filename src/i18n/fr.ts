
export default {
  "common": {
    "back": "Retour",
    "close": "Fermer",
    "loading": "Chargement...",
    "save": "Sauvegarder",
    "cancel": "Annuler",
    "soon": "Bientôt disponible",
    "details": "Détails",
    "status": "Statut",
    "actions": "Actions",
    "search": "Chercher...",
    "refresh": "Actualiser",
    "edit": "Modifier",
    "date": "Date",
    "print": "Imprimer"
  },
  "nav": {
    "dashboard": "Tableau de bord",
    "personeel": "Personnel",
    "planning": "Planning",
    "shifts": "Shifts & Missions",
    "tijdregistraties": "Pointages",
    "rapporten": "Rapports",
    "incidenten": "Incidents & Plaintes",
    "klanten": "Clients & Sites",
    "facturatie": "Facturation & Exports"
  },
  "compliance": {
    "title": "Conformité",
    "compliant": "Conforme",
    "partial": "Partiel",
    "nonCompliant": "Non Conforme"
  },
  "roles": {
    "guard": "Agent",
    "senior": "Chef d'équipe"
  },
  "incidenten": {
    "title": "Incidents",
    "subtitle": "Gestion des incidents et des plaintes",
    "newTitle": "Signaler Incident",
    "detailTitle": "Dossier Incident",
    "newTab": "Nouveau",
    "mineTab": "Mes Incidents",
    "notFound": "Dossier non trouvé.",
    "isDraft": "Ceci est un brouillon.",
    "noContext": "Aucun contexte",
    "confirmArchive": "Êtes-vous sûr de vouloir archiver ce dossier ? Il disparaîtra de l'aperçu actif.",
    "photoLimit": "Maximum 3 photos autorisées.",
    "priorityLabel": "Priorité",
    "emptyList": "Aucun dossier trouvé avec ce statut.",
    "status": {
        "Draft": "Brouillon",
        "Submitted": "Soumis",
        "Approved": "Approuvé",
        "Rejected": "Renvoyé",
        "Archived": "Archivé"
    },
    "tabs": {
        "submitted": "Soumis",
        "approved": "Approuvé",
        "rejected": "Renvoyé",
        "archived": "Archives",
        "all": "Tous"
    },
    "types": {
        "incident": "Rapport d'Incident",
        "complaint": "Dossier de Plainte"
    },
    "severity": {
        "Low": "Faible",
        "Medium": "Moyen",
        "High": "Élevé",
        "Critical": "Critique"
    },
    "fields": {
        "title": "Titre",
        "description": "Description",
        "photos": "Preuves",
        "severity": "Gravité",
        "author": "Auteur"
    },
    "actions": {
        "archive": "Archiver"
    },
    "validation": {
        "required": "Veuillez remplir tous les champs obligatoires."
    },
    "communication": "Communication",
    "commentPlaceholder": "Écrire une note interne...",
    "agent": {
        "linkedShift": "Lié au Shift",
        "selectClient": "Sélectionner Client...",
        "selectLocation": "Sélectionner Lieu (Optionnel)...",
        "selectShift": "Sélectionner Shift (Optionnel)...",
        "titlePlaceholder": "Brève description...",
        "descPlaceholder": "Que s'est-il passé ? Qui était impliqué ?",
        "maxPhotos": "Max 3",
        "addPhoto": "Ajouter",
        "emptyMine": "Aucun incident trouvé.",
        "photoError": "Erreur lors du traitement de la photo."
    },
    "alerts": {
        "emailSuccess": "E-mail envoyé avec succès.",
        "emailFail": "Échec de l'envoi : "
    },
    "emailTemplate": {
        "greeting": "Madame, Monsieur,",
        "body": "Veuillez trouver ci-joint le rapport d'incident <b>{{id}}</b>.",
        "noteLabel": "Remarque :",
        "signatureLine1": "Cordialement,",
        "signatureLine2": "Apex Vigilance Group"
    },
    "email": {
      "send": "Envoyer Email",
      "resend": "Renvoyer",
      "sendTitle": "Envoyer le Dossier",
      "recipients": "Destinataires",
      "commaSeparated": "(séparés par des virgules)",
      "placeholder": "email@client.be, manager@apex.be",
      "subject": "Sujet",
      "defaultSubject": "Incident : {{title}}",
      "message": "Message",
      "messagePlaceholder": "Tapez une lettre de motivation ici...",
      "attachmentInfo": "Le rapport PDF est ajouté automatiquement en pièce jointe.",
      "sending": "Envoi...",
      "sent": "Envoyé",
      "failed": "Échoué",
      "confirmSend": "Envoyer"
    },
    "pdf": {
      "internalComments": "Notes Internes",
      "shiftContext": "Contexte Shift",
      "client": "Client",
      "date": "Date",
      "author": "Auteur",
      "message": "Message"
    }
  },
  "reports": {
    "title": "Rapports",
    "subtitle": "Rapports quotidiens et incidents",
    "new": "Nouveau Rapport",
    "mine": "Mes Rapports",
    "templates": "Modèles",
    "modalTitle": "Nouveau Rapport (Admin)",
    "linkShift": "Lier au Shift (Optionnel)",
    "noShift": "-- Aucun Shift --",
    "startDraft": "Commencer le Brouillon",
    "typeLabel": "Type de Rapport",
    "types": {
      "Daily": "Rapport Quotidien",
      "Incident": "Rapport d'Incident",
      "Patrol": "Rapport de Patrouille",
      "Other": "Autre"
    },
    "status": {
      "Draft": "Brouillon",
      "Submitted": "Soumis",
      "Approved": "Approuvé",
      "Rejected": "Rejeté"
    },
    "severity": {
      "Low": "Faible",
      "Medium": "Moyen",
      "High": "Élevé",
      "Critical": "Critique"
    },
    "fields": {
      "summary": "Résumé",
      "details": "Détails",
      "category": "Catégorie",
      "location": "Lieu",
      "actions": "Actions Prises",
      "involved": "Parties Impliquées",
      "vehicle": "Info Véhicule",
      "followUp": "Suivi Superviseur ?",
      "activities": "Activités",
      "clientNotes": "Note pour Client",
      "internalNotes": "Notes Internes (Admin)",
      "photos": "Photos & Pièces Jointes"
    },
    "actions": {
      "saveDraft": "Sauver brouillon",
      "submit": "Soumettre",
      "approve": "Approuver",
      "reject": "Renvoyer",
      "exportPdf": "Exporter PDF",
      "print": "Imprimer",
      "download": "Télécharger PDF",
      "selectLocation": "Sélectionner Lieu",
      "resendEmail": "Renvoyer l'e-mail"
    },
    "email": {
        "sent": "E-mail Envoyé",
        "failed": "E-mail Échoué",
        "pending": "Envoi en cours...",
        "none": "Non envoyé"
    },
    "audit": {
        "created": "Créé",
        "submitted": "Soumis",
        "approved": "Approuvé",
        "rejected": "Renvoyer"
    }
  },
  "feedback": {
      "titleFallback": "Feedback Requis",
      "description": "Veuillez indiquer une raison claire pour le renvoi de ce rapport. Minimum 10 caractères.",
      "placeholder": "Raison du rejet...",
      "chars": "caractères"
  },
  "print": {
      "deprecated": {
          "title": "Vue d'impression obsolète",
          "desc": "Vous allez être redirigé vers la page de détail du dossier. Utilisez les boutons \"Télécharger PDF\" ou \"Imprimer\"."
      }
  },
  "dashboard": {
    "title": "Aperçu Opérationnel",
    "subtitle": "Statut en temps réel de Apex Vigilance Group",
    "live": "EN DIRECT",
    "kpi": {
      "activeShifts": "Services Actifs",
      "openIncidents": "Incidents Ouverts",
      "totalGuards": "Personnel Total"
    },
    "activity": {
      "title": "Activités en Direct",
      "empty": "Aucune activité recente.",
      "status": {
        "info": "INFO",
        "alert": "ALERTE",
        "success": "OK"
      }
    },
    "quickActions": {
      "title": "Actions Rapides"
    },
    "action": {
      "newShift": "Nouveau Service",
      "reportIncident": "Signaler Incident",
      "timeLogs": "Pointages",
      "reports": "Rapports"
    }
  },
  "personeel": {
    "title": "Personnel",
    "subtitle": "Gestion des agents et du staff",
    "filter": {
      "all": "Tous",
      "active": "Actif",
      "inactive": "Inactief",
      "expiring": "Badge expire bientôt",
      "missing": "Docs manquants"
    },
    "tabs": {
      "profile": "Profil",
      "contract": "Contrat & Tarif",
      "qualifications": "Qualifications",
      "availability": "Disponibilité",
      "documents": "Documents",
      "history": "Historique"
    },
    "statusModal": {
      "title": "Changer le statut",
      "reasonLabel": "Raison du changement (obligatoire)",
      "confirm": "Confirmer"
    }
  },
  "planning": {
    "title": "Planning",
    "subtitle": "Horaires et disponibilités",
    "exeLabel": "Code de fonction (EXE) — optionnel",
    "requirements": "Exigences (optionnel)"
  },
  "shifts": {
    "title": "Shifts & Missions",
    "subtitle": "Services actifs et planifiés",
    "detailTitle": "Détails du Shift",
    "tabs": {
      "mine": "Mes Shifts",
      "applications": "Demandes",
      "open": "Shifts Ouverts"
    },
    "status": {
      "pending": "En attente d'approbation",
      "approved": "Approuvé",
      "rejected": "Refusé",
      "withdrawn": "Retiré",
      "open": "OUVERT",
      "full": "COMPLET"
    },
    "empty": {
      "mine": "Aucun shift planifié.",
      "applications": "Aucune demande.",
      "open": "Aucun shift ouvert trouvé."
    },
    "actions": {
      "viewOpen": "Voir Shifts Ouverts",
      "resetFilter": "Voir toutes les périodes",
      "withdraw": "Retirer la demande",
      "apply": "Postuler pour ce shift"
    },
    "period": {
      "all": "Toutes périodes",
      "today": "Aujourd'hui",
      "week": "Cette semaine",
      "month": "Ce mois"
    },
    "monitor": {
      "title": "Statut Pointages",
      "subtitle": "Statut actuel du personnel assigné",
      "offline": "Aucun enregistrement actif",
      "clockedIn": "Pointé à"
    }
  },
  "tijd": {
    "title": "Pointages",
    "subtitle": "Journal des entrées et sorties",
    "shiftCancelled": "Mission annulée",
    "manualReg": "Pointage manuel",
    "agent": {
        "title": "Pointage",
        "clockIn": "Pointer Entrée",
        "clockOut": "Pointer Sortie",
        "pauseStart": "Début Pause",
        "pauseStop": "Fin Pause",
        "notClocked": "Niet pointé",
        "active": "En service",
        "paused": "En pause",
        "checking": "Vérification localisation...",
        "retry": "Réessayer",
        "inside": "Dans la zone",
        "outside": "Hors zone",
        "unavailable": "Loc. indisponible",
        "unchecked": "Loc. non vérifiée",
        "exceptionTitle": "Confirmer l'écart",
        "photoReq": "Preuve photo obligatoire",
        "reason": "Raison",
        "reasonPh": "Sélectionner une raison...",
        "otherReason": "Autre raison...",
        "reasons": {
            "gps": "GPS défaillant",
            "border": "Juste hors zone",
            "entrance": "Entrée différente",
            "other": "Autre raison"
        },
        "confirm": "Confirmer",
        "warningOut": "Sortie non pointée"
    },
    "admin": {
        "nazicht": "Révision",
        "nazichtTitle": "Révision des Pointages",
        "approve": "Approuver",
        "reject": "Rejeter",
        "comment": "Commentaire",
        "emptyNazicht": "Aucun élément à réviser."
    }
  },
  "klanten": {
    "title": "Clients & Sites",
    "subtitle": "CRM en postinstructies",
    "locatiesBtn": "Voir les Sites",
    "new": "Nouveau Client",
    "newLoc": "Nouveau Site",
    "active": "Actif",
    "inactive": "Inactif",
    "notFound": "Client non trouvé.",
    "noLocs": "Aucun site trouvé.",
    "recentShifts": "Missions Récentes",
    "locationCount": "Sites",
    "form": {
        "name": "Nom de Société",
        "vat": "TVA / BCE",
        "contact": "Personne de Contact",
        "email": "Email",
        "phone": "Téléphone",
        "address": "Adresse Facturation",
        "city": "Ville / Commune",
        "type": "Type de Lieu",
        "access": "Instructions d'Accès",
        "locName": "Nom du Site",
        "locAddress": "Adresse",
        "cancel": "Annuler",
        "create": "Créer"
    },
    "actions": {
        "print": "Imprimer Fiche",
        "viewMap": "Voir sur la carte",
        "viewInvoices": "Historique Facturation"
    }
  },
  "facturatie": {
    "title": "Facturation",
    "subtitle": "Exports financiers et pré-facturation",
    "overviewTitle": "Aperçu des Factures",
    "emptyList": "Aucune facture trouvée.",
    "notFound": "Facture non trouvée.",
    "confirmSend": "Êtes-vous sûr de vouloir envoyer cette facture à {{email}} ?",
    "confirmPaid": "Marquer cette facture comme payée ?",
    "error": {
        "noEmail": "Le client n'a pas d'adresse e-mail."
    },
    "stats": {
        "revenue": "Chiffre d'Affaires",
        "drafts": "Brouillons",
        "outstanding": "En attente",
        "paid": "Payé"
    },
    "actions": {
        "manage": "Gérer Factures",
        "export": "Export CSV",
        "send": "Envoyer",
        "markPaid": "Marquer Payé"
    },
    "create": {
        "title": "Nouvelle Facturation",
        "desc": "Sélectionnez une période et un groupe de clients pour générer des brouillons basés sur les shifts approuvés.",
        "cta": "Démarrer (via Planning)"
    },
    "tabs": {
        "all": "Tous",
        "concept": "Brouillons",
        "sent": "Envoyé",
        "paid": "Payé"
    },
    "status": {
        "Concept": "Brouillon",
        "Sent": "Envoyé",
        "Paid": "Payé"
    },
    "export": {
        "title": "Export Financier",
        "desc": "Télécharger les données de facturation pour la comptabilité (CSV).",
        "from": "Date De",
        "to": "Date À",
        "download": "Télécharger Export"
    },
    "pdf": {
        "title": "FACTURE",
        "number": "Numéro de Facture",
        "clientDetails": "Adresse de Facturation",
        "details": "Détails",
        "dueDate": "Date d'échéance",
        "invoiceDate": "Date de facture",
        "period": "Période",
        "contact": "Contact",
        "dates": "Dates",
        "tel": "Tél",
        "email": "Email",
        "web": "Web",
        "vat": "TVA",
        "col": {
            "desc": "Description",
            "qty": "Quantité",
            "price": "Prix",
            "excl": "Total HT",
            "vat": "TVA",
            "incl": "Total TTC"
        },
        "subtotal": "Sous-total (HT)",
        "vatTotal": "Total TVA",
        "total": "Total à payer",
        "terms": "Veuillez payer avant la date d'échéance en mentionnant le numéro de facture.",
        "paymentTerms1": "Veuillez transférer le montant total avant le",
        "paymentTerms2": "sur le compte :",
        "paymentTerms3": "BIC :",
        "paymentTerms4": "Avec la communication :"
    },
    "email": {
        "subject": "Facture",
        "body": "Cher client, veuillez trouver ci-joint la facture {{number}}.",
        "success": "Facture envoyée avec succès",
        "fail": "Échec de l'envoi de la facture: "
    },
    "locked": "Verrouillé",
    "ogm": "Communication structurée",
    "auditLog": "Historique des modifications",
    "downloadError": "Erreur lors du téléchargement du PDF"
  }
};
