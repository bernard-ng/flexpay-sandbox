<?php
// Run: php scripts/php-smoke.php /absolute/path/to/flexpay-php
require ($argv[1] ?? throw new RuntimeException('Pass the PHP SDK checkout path')).'/vendor/autoload.php';

use Ngandu\Flexpay\Client;
use Ngandu\Flexpay\Credential;
use Ngandu\Flexpay\Data\Currency;
use Ngandu\Flexpay\Request\MobileRequest;
use Ngandu\Flexpay\Request\CardRequest;
use Ngandu\Flexpay\Request\PayoutRequest;
use Symfony\Component\HttpClient\HttpClient;

$base = getenv('FLEXPAY_SIMULATOR_URL') ?: 'http://localhost:8080';
$real = HttpClient::create();
$client = new Client(
    new Credential('test-token', 'TESTMERCHANT'),
    apiBaseUrl: "$base/api/rest/v1",
    cardBaseUrl: "$base/v1.1",
);
$mobile = $client->mobile(new MobileRequest(25, 'php-'.time(), Currency::USD, 'http://127.0.0.1:9000/callback', '243810000001'));
if (!$mobile->isSuccessful()) throw new RuntimeException('Mobile failed');
for ($i=0; $i<100; ++$i) {
    $status = $real->request('GET', "$base/api/rest/v1/check/{$mobile->orderNumber}", ['auth_bearer'=>'test-token'])->toArray();
    if ($status['transaction']['status'] !== '2') break;
    usleep(100000);
}
$checked = $client->check($mobile->orderNumber);
if (!$checked->transaction->isSuccessful() || $checked->transaction->amountCustomer !== 25.63) throw new RuntimeException('Check failed');
$payout = $client->payout(new PayoutRequest(5, 'php-payout-'.time(), Currency::USD, 'http://127.0.0.1:9000/callback', '243810000001'));
if (!$payout->isSuccessful()) throw new RuntimeException('Payout failed');
$card = $client->card(new CardRequest(5, 'php-card-'.time(), Currency::USD, 'SDK compatibility', 'http://127.0.0.1:9000/callback', $base, $base, $base, $base));
if (!$card->isSuccessful() || !str_starts_with($card->url, "$base/checkout/")) throw new RuntimeException('Card failed');
echo "PHP client: mobile, check, payout, card passed.\n";
