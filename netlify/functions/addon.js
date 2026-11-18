exports.handler = async (event, context) => {
    const TMDB_API_KEY = "5d23e5cc5e0db1b6de3e20200521254e"; 
    
    const path = event.path.replace('/.netlify/functions/addon', '');

    if (path === '/manifest.json' || path === '/' || path === '') {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                id: 'org.goalodds.topmovies',
                version: '1.0.0',
                name: 'Top 8.5+',
                description: 'Doar filme și seriale cu nota IMDb peste 8.5',
                resources: ['catalog'],
                types: ['movie', 'series'],
                catalogs: [
                    { type: 'movie', id: 'top_movies', name: 'Top Movies (8.5+)' },
                    { type: 'series', id: 'top_series', name: 'Top Series (8.5+)' }
                ]
            })
        };
    }

    if (path.includes('/catalog/')) {
        const urlParts = path.split('/');
        const type = urlParts[2] === 'movie' ? 'movie' : 'series';
        
        try {
            const url = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&vote_count.gte=3000&vote_average.gte=8.5&language=ro-RO`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.results) throw new Error("Eroare API TMDB.");

            const metas = data.results.map(item => ({
                id: `tt${item.id}`, 
                type: type,
                name: item.title || item.name,
                poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
                description: item.overview || "Fără descriere disponibilă.",
                releaseInfo: (item.release_date || item.first_air_date || '').split('-')[0],
                imdbRating: item.vote_average ? item.vote_average.toFixed(1) : "N/A"
            }));

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ metas: metas })
            };
        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
    return { statusCode: 404, body: "Not found" };
};
