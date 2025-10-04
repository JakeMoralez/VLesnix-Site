
import { newsData } from '../data/news-data.js';

let activeTag = 'all';
let searchQuery = '';

function renderNewsCards() {
    const newsGrid = document.getElementById('news-grid');
    const noResultsEl = document.getElementById('no-news-results');
    if (!newsGrid || !noResultsEl) return;

    // Filter by tag
    let filteredNews = newsData;
    if (activeTag !== 'all') {
        filteredNews = newsData.filter(item =>
            item.tags.some(tag => tag.type === activeTag)
        );
    }

    // Filter by search query
    const query = searchQuery.toLowerCase().trim();
    if (query) {
        filteredNews = filteredNews.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(query);
            const contentMatch = item.content.toLowerCase().includes(query);
            const tagMatch = item.tags.some(tag => tag.text.toLowerCase().includes(query));
            return titleMatch || contentMatch || tagMatch;
        });
    }

    newsGrid.innerHTML = ''; // Clear previous content

    if (filteredNews.length === 0) {
        noResultsEl.style.display = 'block';
        newsGrid.style.display = 'none';
        return;
    }

    noResultsEl.style.display = 'none';
    newsGrid.style.display = 'grid';

    const cardsHtml = filteredNews.map(item => {
        const tagsHtml = item.tags.map(tag => `<span class="tag tag-${tag.type}">${tag.text}</span>`).join('');
        return `
            <div class="news-card">
                <div class="news-card-header">
                    <span class="news-card-date">${item.date}</span>
                    <div class="news-card-tags">${tagsHtml}</div>
                </div>
                <div class="news-card-body">
                    <h3>${item.title}</h3>
                    ${item.content}
                </div>
            </div>
        `;
    }).join('');

    newsGrid.innerHTML = cardsHtml;

    if (typeof gsap !== 'undefined') {
        gsap.fromTo(newsGrid.querySelectorAll('.news-card'),
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
        );
    }
}

function setupNewsFilters() {
    const tagsContainer = document.getElementById('filter-tags-container');
    const searchInput = document.getElementById('news-search-input');
    if (!tagsContainer || !searchInput) return;

    const allTags = newsData.flatMap(item => item.tags.map(tag => tag.type));
    const uniqueTagTypes = [...new Set(allTags)];

    const tagTypeToName = {
        'major': 'Главное',
        'feature': 'Функции',
        'security': 'Безопасность',
        'fix': 'Исправления',
        'update': 'Улучшения'
    };

    let buttonsHtml = `<button class="filter-tag-button active" data-tag="all">Все</button>`;
    uniqueTagTypes.forEach(type => {
        const name = tagTypeToName[type] || type;
        buttonsHtml += `<button class="filter-tag-button" data-tag="${type}">${name}</button>`;
    });

    tagsContainer.innerHTML = buttonsHtml;

    tagsContainer.addEventListener('click', (e) => {
        if (e.target.matches('.filter-tag-button')) {
            tagsContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            activeTag = e.target.dataset.tag;
            renderNewsCards();
        }
    });

    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value;
        renderNewsCards();
    });
}

export function initNewsPage() {
    setupNewsFilters();
    renderNewsCards();
}
