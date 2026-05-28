'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const plans = [
			{
				id: 'P-FREE',
				public_id: 'P-FREE',
				isActive: false, // Changed to inactive
				autoRenewal: true,
				tier: 0,
				names: JSON.stringify({
					en: 'Free Tier',
					es: 'Nivel Gratuito',
					nl: 'Gratis Laag',
					fr: 'Niveau Gratuit',
				}),
				descriptions: JSON.stringify({
					en: ['Basic access to content', 'Single screen viewing', 'Limited content library', 'Ad-supported streaming'],
					es: ['Acceso básico a contenido', 'Visualización en una pantalla', 'Biblioteca de contenido limitada', 'Transmisión con anuncios'],
					nl: ['Basis toegang tot content', 'Enkel scherm weergave', 'Beperkte content bibliotheek', 'Streamen met advertenties'],
					fr: ['Accès de base au contenu', 'Visionnage sur un écran', 'Bibliothèque de contenu limitée', 'Diffusion avec publicités'],
				}),
				price: 0.0,
				currency: 'EUR', // Changed to ISO code
				maxPaymentFailure: 3,
				maxScreen: 1,
				countryCode: 'NL',
				index: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 'P-53M537709S3864946M6ORYUQ',
				public_id: 'P-7MM217',
				isActive: true,
				autoRenewal: true,
				tier: 3,
				names: JSON.stringify({
					en: 'Basic Plan',
					es: 'Plan Básico',
					nl: 'Basisplan',
					fr: 'Plan de Base',
				}),
				descriptions: JSON.stringify({
					en: ['HD streaming quality', 'Two simultaneous screens', 'Access to standard library', 'Limited offline downloads'],
					es: ['Calidad de transmisión HD', 'Dos pantallas simultáneas', 'Acceso a biblioteca estándar', 'Descargas offline limitadas'],
					nl: ['HD streamkwaliteit', 'Twee gelijktijdige schermen', 'Toegang tot standaard bibliotheek', 'Beperkte offline downloads'],
					fr: ['Qualité de streaming HD', 'Deux écrans simultanés', 'Accès à la bibliothèque standard', 'Téléchargements hors ligne limités'],
				}),
				price: 7.99,
				currency: 'EUR',
				maxPaymentFailure: 3,
				maxScreen: 2, // Increased from 1
				countryCode: 'NL',
				index: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 'P-38P3347231054464WM6OR2FA',
				public_id: 'P-7BN609',
				isActive: true,
				autoRenewal: true,
				tier: 2,
				names: JSON.stringify({
					en: 'Standard Plan',
					es: 'Plan Estándar',
					nl: 'Standaardplan',
					fr: 'Plan Standard',
				}),
				descriptions: JSON.stringify({
					en: ['Full HD streaming', 'Four simultaneous screens', 'Expanded content library', 'Unlimited offline downloads'],
					es: ['Transmisión Full HD', 'Cuatro pantallas simultáneas', 'Biblioteca de contenido ampliada', 'Descargas ilimitadas sin conexión'],
					nl: ['Full HD streamen', 'Vier gelijktijdige schermen', 'Uitgebreide content bibliotheek', 'Onbeperkte offline downloads'],
					fr: ['Streaming Full HD', 'Quatre écrans simultanés', 'Bibliothèque de contenu élargie', 'Téléchargements illimités hors ligne'],
				}),
				price: 9.99,
				currency: 'EUR',
				maxPaymentFailure: 3,
				maxScreen: 4, // Increased from 1
				countryCode: 'NL',
				index: 2,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 'P-37X699659D1803923M6OR2RA',
				public_id: 'P-2XD231',
				isActive: true,
				autoRenewal: true,
				tier: 1,
				names: JSON.stringify({
					en: 'Premium Plan', // Corrected spelling
					es: 'Plan Premium',
					nl: 'Premiumplan',
					fr: 'Plan Premium',
				}),
				descriptions: JSON.stringify({
					en: ['4K Ultra HD streaming', 'Six simultaneous screens', 'Full content library access', 'Premium customer support'],
					es: ['Transmisión 4K Ultra HD', 'Seis pantallas simultáneas', 'Acceso completo a la biblioteca', 'Soporte premium al cliente'],
					nl: ['4K Ultra HD streamen', 'Zes gelijktijdige schermen', 'Volledige content bibliotheek toegang', 'Premium klantenservice'],
					fr: ['Streaming 4K Ultra HD', 'Six écrans simultanés', 'Accès complet à la bibliothèque', 'Support client premium'],
				}),
				price: 12.99,
				currency: 'EUR',
				maxPaymentFailure: 3,
				maxScreen: 6, // Increased from 1
				countryCode: 'NL',
				index: 3,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		// Prepare plans for insertion (remove countryCode)
		const plansToInsert = plans.map(({ countryCode, ...plan }) => plan);

		// Insert the plans into the Plans table
		await queryInterface.bulkInsert('Plans', plansToInsert, {});

		// Now, create the PlanCountry relationships for each plan
		const planCountries = plans.map((plan) => ({
			planId: plan.id,
			countryCode: plan.countryCode,
		}));

		// Insert the relationships into the PlanCountry table
		await queryInterface.bulkInsert('PlanCountries', planCountries, {});
	},

	down: async (queryInterface, Sequelize) => {
		// Delete all PlanCountry relationships
		await queryInterface.bulkDelete('PlanCountries', null, {});

		// Delete all plans
		await queryInterface.bulkDelete('Plans', null, {});
	},
};
