const http = require('http');
const TMDB_API_KEY = "5d23e5cc5e0db1b6de3e20200521254e";

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url.includes('/manifest.json')) {
        res.writeHead(200);
        res.end(JSON.stringify({
            id: 'org.goalodds.topmovies',
            version: '1.0.0',
            name: 'Top 8.5+',
            description: 'Filme și seriale IMDb 8.5+',
            resources: ['catalog'],
            types: ['movie', 'series'],
            catalogs: [
                { type: 'movie', id: 'top_movies', name: 'Top Movies (8.5+)' },
                { type: 'series', id: 'top_series', name: 'Top Series (8.5+)' }
            ]
        }));
        return;
    }

    if (req.url.includes('/catalog')) {
        const type = req.url.includes('/series/') ? 'series' : 'movie';
        try {
            const response = await fetch(`https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&vote_count.gte=3000&vote_average.gte=8.5&language=ro-RO`);
            const data = await response.json();

            const metas = (data.results || []).map(item => ({
                id: `tt${item.id}`,
                type: type,
                name: item.title || item.name,
                poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster',
                description: item.overview || "Fără descriere.",
                releaseInfo: (item.release_date || item.first_air_date || '').split('-')[0],
                imdbRating: item.vote_average ? item.vote_average.toFixed(1) : "N/A"
            }));

            res.writeHead(200);
            res.end(JSON.stringify({ metas: metas }));
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
