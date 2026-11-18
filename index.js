const http = require('http');
const TMDB_API_KEY = "5d23e5cc5e0db1b6de3e20200521254e";

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url.includes('/manifest.json')) {
        res.writeHead(200);
        res.end(JSON.stringify({
            id: 'org.goalodds.topmovies',
            version: '1.0.7', 
            name: 'Top Filme & Seriale',
            description: 'Filme și seriale de top',
            resources: ['catalog'],
            types: ['movie', 'series'],
            catalogs: [
                { type: 'movie', id: 'top_movies', name: 'Top Movies (8.0+)' },
                { type: 'series', id: 'best_series', name: 'Top Series (All)' }
            ]
        }));
        return;
    }

    if (req.url.includes('/catalog')) {
        const type = req.url.includes('/series/') ? 'series' : 'movie';
        try {
            // Luam DOAR 2 pagini ca sa nu mai dam rate-limit la TMDB
            const response = await fetch(`https://api.themoviedb.org/3/${type}/top_rated?api_key=${TMDB_API_KEY}&language=ro-RO&page=1`);
            const data1 = await response.json();
            
            // Facem o mica pauza de 300ms intre cereri
            await new Promise(r => setTimeout(r, 300));
            
            const response2 = await fetch(`https://api.themoviedb.org/3/${type}/top_rated?api_key=${TMDB_API_KEY}&language=ro-RO&page=2`);
            const data2 = await response2.json();

            let combined = [];
            if (data1.results) combined = combined.concat(data1.results);
            if (data2.results) combined = combined.concat(data2.results);

            const metas = combined
                .filter(item => type === 'series' || (item.vote_average || 0) >= 8.0) 
                .map(item => ({
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
