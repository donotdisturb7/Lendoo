-- Structure de la table items (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_day DECIMAL(10, 2) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Structure de la table cart_items
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

-- Structure de la table orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Structure de la table order_items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exemples de données pour la table items (si elle n'a pas déjà des données)
INSERT INTO items (name, description, price_per_day, available, image_url) VALUES
('Perceuse professionnelle', 'Perceuse à percussion haute performance pour tous types de matériaux', 15.99, TRUE, 'https://example.com/images/drill.jpg'),
('Échelle télescopique', 'Échelle extensible jusqu''à 5 mètres, idéale pour les travaux en hauteur', 12.50, TRUE, 'https://example.com/images/ladder.jpg'),
('Tronçonneuse électrique', 'Tronçonneuse puissante pour couper branches et petits arbres', 25.00, TRUE, 'https://example.com/images/chainsaw.jpg'),
('Ponceuse orbitale', 'Ponceuse ergonomique pour tous types de surfaces', 9.99, TRUE, 'https://example.com/images/sander.jpg'),
('Marteau-piqueur', 'Marteau-piqueur professionnel pour travaux de démolition', 35.00, TRUE, 'https://example.com/images/jackhammer.jpg'),
('Scie circulaire', 'Scie circulaire précise pour coupes droites dans le bois', 18.50, TRUE, 'https://example.com/images/circular-saw.jpg'),
('Compresseur d''air', 'Compresseur portable pour gonflage et outils pneumatiques', 22.00, TRUE, 'https://example.com/images/compressor.jpg'),
('Débroussailleuse', 'Débroussailleuse puissante pour entretien de jardin', 20.00, TRUE, 'https://example.com/images/trimmer.jpg'),
('Nettoyeur haute pression', 'Nettoyeur haute pression pour surfaces extérieures', 28.50, TRUE, 'https://example.com/images/pressure-washer.jpg'),
('Meuleuse d''angle', 'Meuleuse polyvalente pour découpe et ponçage', 14.99, TRUE, 'https://example.com/images/grinder.jpg');

-- Note: Les tables cart_items, orders et order_items seront remplies par les utilisateurs lors de l'utilisation de l'application
