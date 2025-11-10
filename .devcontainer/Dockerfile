
# Base PHP image
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
        unzip \
            curl \
                libpq-dev \
                    npm \
                        nodejs \
                            vim \
                                && rm -rf /var/lib/apt/lists/*

                                # Install PHP extensions
                                RUN docker-php-ext-install pdo pdo_pgsql

                                # Install Composer
                                COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

                                # Set working directory
                                WORKDIR /workspace