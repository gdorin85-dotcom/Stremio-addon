const http = require('http');
const TMDB_API_KEY = "5d23e5cc5e0db1b6de3e20200521254e";

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url.includes('/manifest.json')) {
        res.writeHead(200);
        res.end(JSON.stringify({
            id: 'org.goalodds.topmovies',
            version: '1.0.4', // Versiune noua
            name: 'Top Filme 8.0+',
            description: 'Filme și seriale cu nota buna',
            resources: ['catalog'],
            types: ['movie', 'series'],
            catalogs: [
                { type: 'movie', id: 'top_movies', name: 'Top Movies (8.0+)' },
                { type: 'series', id: 'top_series', name: 'Top Series (8.0+)' }
            ]
        }));
        return;
    }

    if (req.url.includes('/catalog')) {
        const type = req.url.includes('/series/') ? 'series' : 'movie';
        try {
            let allMetas = [];
            
            const pagesToFetch = type === 'movie' ? 20 : 10;
            
            for (let page = 1; page <= pagesToFetch; page++) {
                // FOLOSIM TOP_RATED PENTRU AMBELE (si filme, si seriale)
                const endpoint = 'top_rated';
                const response = await fetch(`https://api.themoviedb.org/3/${type}/${endpoint}?api_key=${TMDB_API_KEY}&language=ro-RO&page=${page}`);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    const pageMetas = data.results
                        .filter(item => (item.vote_average || 0) >= 8.0) 
                        .map(item => ({
                            id: `tt${item.id}`,
                            type: type,
                            name: item.title || item.name,
                            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
                            description: item.overview || "Fără descriere.",
                            releaseInfo: (item.release_date || item.first_air_date || '').split('-')[0],
                            imdbRating: item.vote_average ? item.vote_average.toFixed(1) : "N/A"
                        }));
                    allMetas = allMetas.concat(pageMetas);
                }
            }

            res.writeHead(200);
            res.end(JSON.stringify({ metas: allMetas }));
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
