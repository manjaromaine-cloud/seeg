# Roadmap des Nouvelles Fonctionnalités

Voici la liste des fonctionnalités que je vais implémenter, par ordre de priorité :

## 1. Signalement/Création d'Incidents par l'Utilisateur

**Objectif :** Permettre aux utilisateurs de soumettre de nouveaux incidents via l'application.

**Plan d'implémentation :**
*   **Étape 1 :** Créer un nouveau composant React (`IncidentForm.tsx`) pour le formulaire de soumission d'incident.
*   **Étape 2 :** Concevoir le formulaire avec les champs nécessaires (type d'incident, description, localisation - potentiellement via une carte ou des coordonnées).
*   **Étape 3 :** Intégrer le formulaire avec Supabase pour stocker les nouvelles données d'incident dans la base de données.
*   **Étape 4 :** Ajouter une validation de base pour les champs du formulaire.
*   **Étape 5 :** Ajouter un bouton ou un lien dans l'interface utilisateur existante pour accéder à ce formulaire (par exemple, sur la page d'accueil ou une page dédiée).

## 2. Filtrage et Recherche Avancés des Incidents

**Objectif :** Améliorer la capacité des utilisateurs à trouver des incidents spécifiques dans la liste existante.

**Plan d'implémentation :**
*   **Étape 1 :** Modifier le composant `IncidentsList.tsx` pour inclure des éléments d'interface utilisateur pour le filtrage (par exemple, des sélecteurs pour le statut, le type) et une barre de recherche pour la description.
*   **Étape 2 :** Ajuster la logique de récupération des données pour `IncidentsList` afin d'intégrer ces filtres lors de l'interrogation de Supabase.

## 3. Fonctionnalités Cartographiques Interactives (Affichage des Détails d'Incident au Clic)

**Objectif :** Rendre la carte plus interactive en permettant aux utilisateurs de visualiser les détails d'un incident en cliquant sur son marqueur.

**Plan d'implémentation :**
*   **Étape 1 :** Modifier le composant `MapView.tsx` pour rendre les marqueurs d'incident cliquables.
*   **Étape 2 :** Lors du clic sur un marqueur, afficher les détails de l'incident dans une barre latérale ou une modale.
*   **Étape 3 :** S'assurer que les données détaillées de l'incident sont récupérées et affichées correctement.
