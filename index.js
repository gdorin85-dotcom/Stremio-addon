const http = require('http');
const TMDB_API_KEY = "5d23e5cc5e0db1b6de3e20200521254e";

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url.includes('/manifest.json')) {
        res.writeHead(200);
        res.end(JSON.stringify({
            id: 'org.goalodds.topmovies',
            version: '1.0.5', 
            name: 'Top Filme 8.0+',
            description: 'Filme și seriale cu nota buna',
            resources: ['catalog'],
            types: ['movie', 'series'],
            catalogs: [
                { type: 'movie', id: 'top_movies', name: 'Top Movies (8.0+)' },
                // Am schimbat ID-ul aici ca sa fortam refresh-ul
                { type: 'series', id: 'best_series', name: 'Top Series (All)' } 
            ]
        }));
        return;
    }

    if (req.url.includes('/catalog')) {
        const type = req.url.includes('/series/') ? 'series' : 'movie';
        try {
            let allMetas = [];
            
            // Tragem 10 pagini pentru ambele
            const pagesToFetch = 10;
            
            for (let page = 1; page <= pagesToFetch; page++) {
                const endpoint = 'top_rated';
                const response = await fetch(`https://api.themoviedb.org/3/${type}/${endpoint}?api_key=${TMDB_API_KEY}&language=ro-RO&page=${page}`);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    const pageMetas = data.results
                        // FILTRUL: Doar la filme punem 8.0. La seriale le luam pe toate!
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
}); nu 
