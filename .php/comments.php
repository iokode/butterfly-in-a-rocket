<?php

$repository = 'blog';
$repositoryOwner = 'iokode';

error_reporting(E_ERROR | E_PARSE);

function get_github_real_name(string $username): string {
    $url = "https://api.github.com/users/$username";
    $headers = [
        "Authorization: Bearer " . getenv('GITHUB_TOKEN'),
        "Content-Type: application/json",
        "User-Agent: PHP"
    ];

    $options = [
        'http' => [
            'method' => 'GET',
            'header' => implode("\r\n", $headers),
            'ignore_errors' => true
        ]
    ];

    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);

    if ($response === false) {
        return $username;
    }

    $data = json_decode($response, true);

    if (!empty($data['name'])) {
        return $data['name'];
    }

    return $username;
}

function error(string $message): void {
    header('Content-Type: application/json');
    echo json_encode([
        'error' => $message
    ]);
    die;
}

header('Content-Type: application/json');

$discussionId = $_GET['discussionId'] ?? null;

if (!$discussionId) {
    error('Missing required "discussionId" query parameter');
}

$token = getenv('GITHUB_TOKEN');
$query = <<<'QUERY'
query ($repository: String!, $repositoryOwner: String!, $discussionId: Int!) {
    repository(name: $repository, owner: $repositoryOwner) {
        discussion(number: $discussionId) {
            comments(first: 100) {
                nodes {
                    bodyHTML
                    createdAt
                    upvoteCount
                    author {
                        login
                        avatarUrl
                    }
                    replies(first: 100) {
                        nodes {
                            bodyHTML
                            createdAt
                            upvoteCount
                            author {
                                login
                                avatarUrl
                            }
                        }
                    }
                }
            }
        }
    }
}
QUERY;

$url = 'https://api.github.com/graphql';
$headers = [
    "Authorization: Bearer $token",
    "Content-Type: application/json",
    "User-Agent: PHP"
];

$variables = json_encode([
    "repository" => $repository,
    "repositoryOwner" => $repositoryOwner,
    "discussionId" => (int)$discussionId
]);

$options = [
    'http' => [
        'method' => 'POST',
        'header' => implode("\r\n", $headers),
        'content' => json_encode(['query' => $query, 'variables' => $variables]),
        'ignore_errors' => true
    ]
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

if ($response === false) {
    error("Error while calling GitHub GraphQL API");
}

$data = json_decode($response, true);

if (isset($data['errors'])) {
    error("GraphQL API errors: " . json_encode($data['errors']));
}

$comments = array_map(function ($node) {
    if ($node['author'] === null) {
        $node['author'] = [
            'login' => 'ghost',
            'avatarUrl' => 'https://avatars.githubusercontent.com/u/10137?v=4',
        ];
    }

    return [
        'body' => $node['bodyHTML'],
        'user' => [
            'realName' => get_github_real_name($node['author']['login']),
            'username' => $node['author']['login'],
            'avatarUrl' => $node['author']['avatarUrl'],
        ],
        'creationDate' => $node['createdAt'],
        'replies' => array_map(function ($replyNode) {
            if ($replyNode['author'] === null) {
                $replyNode['author'] = [
                    'login' => 'ghost',
                    'avatarUrl' => 'https://avatars.githubusercontent.com/u/10137?v=4',
                ];
            }

            return [
                'body' => $replyNode['bodyHTML'],
                'user' => [
                    'realName' => get_github_real_name($replyNode['author']['login']),
                    'username' => $replyNode['author']['login'],
                    'avatarUrl' => $replyNode['author']['avatarUrl'],
                ],
                'creationDate' => $replyNode['createdAt'],
                'replies' => [], // We only handle one level of replies
                'positiveReactions' => $replyNode['upvoteCount'],
            ];
        }, $node['replies']['nodes'] ?? []),
        'positiveReactions' => $node['upvoteCount'],
    ];
}, $data['data']['repository']['discussion']['comments']['nodes'] ?? []);

echo json_encode($comments);